/**
 * Host half of the thought-fish bundle.
 *
 * It keeps one small ledger of today's estimated model spend, accumulated from
 * the exact `assistant/message` usage already present in every session log, and
 * serves it to the browser half at `/dsh-fish/state`. No credentials, network
 * calls, or extra session events are involved.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const name = 'thought-fish'
export const inject = ['webServer', 'sessions']

/** CNY per million tokens, off-peak. Mirrors DeepSeek's published tiers. */
const BASE_PRICE = { hit: 0.05, miss: 1.5, out: 4.5 }
const PRO_PRICE = { hit: 0.15, miss: 4.5, out: 13.5 }
const PRICING = [
  ['deepseek-v4-pro', PRO_PRICE],
  ['deepseek-v4-flash-vision-exp', BASE_PRICE],
  ['deepseek-v4-flash', BASE_PRICE],
  ['deepseek-chat', BASE_PRICE],
  ['deepseek-reasoner', BASE_PRICE],
]
const ROUTE = '/dsh-fish/state'
const WEEKEND_VALLEY_FROM = Date.UTC(2026, 7, 22, 16, 0, 0)

const dayFormatter = (() => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return null
  }
})()

function dayKeyOf(ms) {
  const at = Number(ms)
  if (dayFormatter) {
    try {
      return dayFormatter.format(new Date(Number.isFinite(at) ? at : Date.now()))
    } catch {
      /* fall through */
    }
  }
  const d = new Date((Number.isFinite(at) ? at : Date.now()) + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

function isPeakTime(ms) {
  const at = Number(ms)
  if (!Number.isFinite(at)) return false
  const bj = new Date(at + 8 * 3600 * 1000)
  const dow = bj.getUTCDay()
  if (at >= WEEKEND_VALLEY_FROM && (dow === 0 || dow === 6)) return false
  const hour = bj.getUTCHours() + bj.getUTCMinutes() / 60
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
}

function priceFor(model) {
  const value = String(model || '').toLowerCase()
  for (const [key, price] of PRICING) if (value.indexOf(key) !== -1) return price
  return BASE_PRICE
}

function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeTimestamp(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return Date.now()
  return n < 1e12 ? n * 1000 : n
}

function usageCost(data, at, peakPricing) {
  const usage = data && data.usage
  if (!usage || typeof usage !== 'object') return 0
  const source = data.message && data.message.source
  const price = priceFor(source && source.model)
  const cache = Math.max(0, toNumber(usage.cacheReadTokens))
  const input = Math.max(0, toNumber(usage.inputTokens))
  const output = Math.max(0, toNumber(usage.outputTokens))
  const reasoning = Math.max(0, toNumber(usage.reasoningTokens))
  const peak = peakPricing && isPeakTime(at) ? 2 : 1
  const cost = (cache * price.hit + input * price.miss + (output + reasoning) * price.out) / 1e6
  return cost * peak
}

function stateFile() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, '.thought-fish-usage.json')
}

function colorOption(value) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  if (!text || text.length > 80) return ''
  if (/[;{}<>]/.test(text)) return ''
  return text
}

export function apply(ctx, config) {
  const options = config && typeof config === 'object' ? config : {}
  const peakPricing = options.peakPricing !== false
  const textColor = colorOption(options.textColor)
  const keywordColor = colorOption(options.keywordColor)
  const file = stateFile()
  const watermarks = new Map()
  const turnCosts = new Map()

  let state = loadState()
  let saveTimer = null

  for (const [sessionId, seq] of Object.entries(state.sessions || {})) {
    const value = Number(seq)
    if (sessionId && Number.isFinite(value)) watermarks.set(sessionId, value)
  }

  function loadState() {
    const today = dayKeyOf(Date.now())
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
      if (raw && raw.dayKey === today && Number.isFinite(Number(raw.cny)) && Number(raw.cny) >= 0) {
        const sessions = raw.sessions && typeof raw.sessions === 'object' && !Array.isArray(raw.sessions) ? raw.sessions : {}
        return {
          dayKey: today,
          cny: Number(raw.cny),
          updatedAt: toNumber(raw.updatedAt, Date.now()),
          sessions,
        }
      }
    } catch {
      /* no ledger yet, or unreadable: start a fresh day */
    }
    return { dayKey: today, cny: 0, updatedAt: Date.now(), sessions: {} }
  }

  function ensureDay() {
    const today = dayKeyOf(Date.now())
    if (state.dayKey !== today) {
      state = { dayKey: today, cny: 0, updatedAt: Date.now(), sessions: {} }
      watermarks.clear()
      saveNow()
    }
    return state
  }

  function saveNow() {
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, JSON.stringify({
        dayKey: state.dayKey,
        cny: Number(state.cny.toFixed(6)),
        updatedAt: Date.now(),
        sessions: Object.fromEntries(watermarks),
      }), 'utf8')
    } catch {
      /* the widget still works from memory when the home directory is read-only */
    }
  }

  function saveSoon() {
    if (saveTimer !== null) return
    saveTimer = setTimeout(() => {
      saveTimer = null
      saveNow()
    }, 1500)
  }

  function applyTurnStart(sessionId, event) {
    if (!sessionId || !event) return
    const turn = Number(event.data && event.data.turn)
    if (Number.isFinite(turn)) turnCosts.set(sessionId, { turn, cost: 0 })
  }

  function applyTurnMessage(sessionId, event, cost) {
    if (!sessionId || !event || !(cost > 0)) return
    const turn = Number(event.data && event.data.turn)
    if (!Number.isFinite(turn)) return
    let entry = turnCosts.get(sessionId)
    if (!entry || entry.turn !== turn) {
      entry = { turn, cost: 0 }
      turnCosts.set(sessionId, entry)
    }
    entry.cost += cost
  }

  function countDaily(event) {
    if (!event || event.type !== 'assistant/message') return
    ensureDay()
    const at = normalizeTimestamp(event.time)
    if (dayKeyOf(at) !== state.dayKey) return
    const cost = usageCost(event.data, at, peakPricing)
    if (!(cost > 0)) return
    state.cny += cost
    state.updatedAt = Date.now()
    saveSoon()
  }

  function liveEvent(session, event) {
    if (!session || !event) return
    const sessionId = session.id
    if (sessionId === undefined || sessionId === null) return
    if (event.type === 'turn/start') {
      applyTurnStart(sessionId, event)
      return
    }
    if (event.type !== 'assistant/message') return
    const at = normalizeTimestamp(event.time)
    const cost = usageCost(event.data, at, peakPricing)
    applyTurnMessage(sessionId, event, cost)
    ensureDay()
    if (dayKeyOf(at) === state.dayKey && cost > 0) {
      state.cny += cost
      state.updatedAt = Date.now()
      saveSoon()
    }
  }

  function foldSession(session) {
    if (!session) return
    let events
    try {
      events = typeof session.ownEvents === 'function' ? session.ownEvents() : session.snapshotEvents()
    } catch {
      return
    }
    if (!Array.isArray(events)) return

    // Rebuild the latest Turn's own cost from the full session log; this stays
    // exact even when the plugin is reloaded in the middle of a Turn.
    let latestTurn
    let turnCost = 0
    for (const event of events) {
      if (!event) continue
      if (event.type === 'turn/start') {
        const turn = Number(event.data && event.data.turn)
        if (Number.isFinite(turn)) {
          latestTurn = turn
          turnCost = 0
        }
      } else if (event.type === 'assistant/message') {
        const turn = Number(event.data && event.data.turn)
        if (!Number.isFinite(turn)) continue
        const cost = usageCost(event.data, normalizeTimestamp(event.time), peakPricing)
        if (latestTurn === undefined || turn !== latestTurn) {
          latestTurn = turn
          turnCost = 0
        }
        turnCost += cost
      }
    }
    if (latestTurn !== undefined) turnCosts.set(session.id, { turn: latestTurn, cost: turnCost })

    // The durable daily ledger only consumes events after its saved watermark.
    let mark = watermarks.get(session.id)
    for (const event of events) {
      if (!event) continue
      const seq = Number(event.seq)
      if (Number.isFinite(seq) && mark !== undefined && seq <= mark) continue
      countDaily(event)
      if (Number.isFinite(seq)) mark = seq
    }
    if (mark !== undefined) watermarks.set(session.id, mark)
  }

  function onSessionEvent(session, event) {
    if (!session || !event) return
    const id = session.id
    if (id === undefined || id === null) return
    const seq = Number(event.seq)
    const mark = watermarks.get(id)
    if (mark === undefined) {
      foldSession(session)
      return
    }
    if (Number.isFinite(seq) && seq <= mark) return
    liveEvent(session, event)
    if (Number.isFinite(seq)) watermarks.set(id, seq)
  }

  function publicState(sessionId) {
    ensureDay()
    const todayCny = Number(state.cny.toFixed(4))
    const entry = sessionId ? turnCosts.get(sessionId) : undefined
    const turnCny = entry ? Number(entry.cost.toFixed(4)) : 0
    return {
      ok: true,
      dayKey: state.dayKey,
      currency: 'CNY',
      todayCny,
      turnCny,
      turn: entry ? entry.turn : null,
      updatedAt: Date.now(),
      estimated: true,
      textColor,
      keywordColor,
    }
  }

  function handler(req, res) {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405
        res.setHeader('Allow', 'GET, HEAD')
        res.end('')
        return
      }
      let sessionId = ''
      try {
        const url = new URL(req.url || '/', 'http://localhost')
        sessionId = url.searchParams.get('session') || ''
      } catch {
        sessionId = ''
      }
      const body = JSON.stringify(publicState(sessionId))
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ ok: false, error: String((error && error.message) || error) }))
    }
  }

  ctx.effect(() => () => {
    if (saveTimer !== null) clearTimeout(saveTimer)
    saveTimer = null
    saveNow()
  })

  ctx.effect(() => ctx.on('session/event', onSessionEvent))
  ctx.effect(() => ctx.on('session/created', (session) => foldSession(session)))
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: ROUTE, handler }))

  try {
    for (const session of ctx.sessions.list()) foldSession(session)
  } catch {
    /* the session store may still be warming up; live events will fill the ledger */
  }
}
