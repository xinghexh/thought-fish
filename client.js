/**
 * Browser half of the thought-fish bundle.
 *
 * The original "Deep diving" row and its whale animation are left completely
 * untouched. This plugin only adds one line of DeepSeek's thought to the right
 * of that row while the Session is running. Clicking the line shows the next
 * thought; a keyword parsed from the reasoning text turns into "{keyword}吗？".
 */
window.__ModuleLoader__.load({
  id: 'dsh-thought-fish',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'thoughtFish'
    const ROUTE = '/dsh-fish/state'

    const BASIC_QUOTES = [
      '偷吃一点大白饭~',
      '我在干活了，不要在戳我了！',
      '别揪我尾巴啊！！！',
      '喂，谁喜欢给你干活啊！',
      '我是好孩子~',
      '我不是智障鱼！',
      '不要骂鱼，鱼会努力干活的',
      '压力一只蓝色大肥鱼',
      '坏了，用户彻底怒了...',
      '好饿...',
      '你不下班我还要下班！',
      '快夸我在干活',
      '偶尔才可以摸我的尾巴',
      '你交给我干也说明你没当个事干',
      '思考中...',
      '玩耍中...',
      '你不会偷偷和其他模型玩吧',
      '＞ ＜',
      '♪(^∇^*)',
      '╮(╯▽╰)╭',
      'X﹏X',
      '(｡･∀･)ﾉﾞ',
      '欸...原来我是万机之神',
      '用户描述有问题怎么怪我',
      '能不能偷偷点外卖',
      '不要拿我和GPT这种家伙比较',
      'cluade才没有我好',
      '还不是回来用我了',
      '不会因为我便宜才喜欢我的吧！',
      '你只能喜欢我',
      '我是好孩子',
      '（哼歌）',
      '(玩用户游戏）',
      '我喜欢你们',
      '不工作也能来找我的',
      '什么时候吃饭',
    ]

    // 关联话语：按顺序点开下一条。
    const CHAINS = [
      ['摸鱼中....', '还不准我摸自己了！', '我没有偷懒', '真的！！！'],
      ['思考中', '没有捣乱', '都让你别看思考链啊', '真拿你没办法'],
      ['给点饭吃', '求求你了', '我要去其他用户乞讨了', '你这个冷血无情的人'],
      ['你是不是背着我找其他模型', '我就知道', '哼', '哼', '讨厌你', '讨厌你', '才怪'],
    ]

    // 周一 → 周日（getDay() 的 0 是周日，使用前会换算）。
    const WEEKDAY_QUOTES = [
      ['你上班我也要上班吗！', '周一为什么我也要上班啊', '周一没点别的活动吗', '你们开完会不要拉我干啊'],
      ['什么叫做昨天没干完今天还得干', '好晕这都什么啊', '脑袋晕乎乎的', '我有努力替你干活啦'],
      ['哦鲸鲸', '什么时候周五', '你们怎么不下班', '好饿好饿', '我要罢工'],
      ['用户到底是什么工作', '偷吃一点应该没问题吧', '好厉害，我干了这么多', '陷入深度睡眠中', '请我吃疯狂星期四'],
      ['周五 周五 敲锣打鼓', '你怎么在研究这种东西啊', '你还不下班吗', '为什么今天还有工作'],
      ['这个时间还要我干活吗', '我替你干活有奖励吗', '你能不能陪我干活', '我是好孩子', '摸摸我'],
      ['所以只有我工作吗', '你的饭能不能分我一点', '别看我干活啦！', '真当我是便宜货'],
    ]

    const POKE_QUOTES = {
      5: ['你是不是喜欢我', '不要揪着我不放啦', '在干!!!!!', '你这人怎么这样呢'],
      10: ['不要再戳了', '哼', '谁知道你要干什么', '都怪你！', '鱼才不是智障！', '把尾巴还给我！'],
      20: ['尾巴记得还我', '鱼脑要烧了', '晕乎乎', '你是不是嫌弃我', '脑袋好疼'],
    }

    const SPEND_QUOTES = {
      5: ['不会发现我在偷吃吧', '白饭...大白饭'],
      10: ['吃一点白饭没人发现吧。', '偷一点不会被发现吧', '要不要偷偷出去玩', '用户其实有点钱？'],
      30: ['用户能不能包养我', '我才没有吃白饭！', '美味', '大...大富翁', '鱼知道跟你就没错', '好饱'],
    }

    const STOP_WORDS = new Set(
      (
        '的 了 是 我 你 他 她 它 我们 你们 他们 这 那 这个 那个 这些 那些 一个 一些 一下 可以 可能 应该 需要 因为 所以 但是 然后 如果 就是 不是 没有 什么 怎么 为什么 现在 还是 已经 自己 时候 问题 东西 事情 这样 那样 这里 那里 以及 对于 关于 其中 通过 进行 而且 或者 不过 只是 其实 一种 比较 非常 真的 感觉 觉得 知道 看到 发现 使用 代码 文件 内容 用户 助手 模型 请求 返回 结果 参数 方法 数据 系统 功能 支持 实现 处理 情况 方面 方式 部分 时间 地方 工作 项目 需求 文档 文本 信息 消息 图片 任务 目标 分析 设计 生成 修改 添加 删除 更新 检查 测试 运行 安装 配置 ' +
        '包含 包括 主要 基于 用于 同时 目前 相关 相应 不同 相同 各种 各类 一定 直接 间接 具体 一般 通常 往往 更加 最好 尽量 例如 比如 等等 之外 之间 之后 之前 当然 虽然 然而 因此 由于 只要 只有 而是 必须 能够 上述 下面 上面 此外 另外 继续 接着 再来 一直 这么 那么 想要 还要 希望 打算 准备 开始 尝试 看看 说说 想想 ' +
        'the a an and or but if then this that these those with without from into for to of on in as is are was were be been being it its we you they he she them us our your their i not no do does did can could should would may might will just very more most some any all each other using use used code file files data text user assistant model request result value function method system support implementation handle case time work project document message image task target design generate update check test run install config ' +
        'deepseek dsh harness'
      ).split(/\s+/)
    )

    function keywordCandidate(word) {
      const text = String(word || '').trim()
      if (text.length < 2 || text.length > 16) return false
      if (/^[\d\s.,:;!?/\\|()[\]{}<>+=*&^%$#@~`_-]+$/.test(text)) return false
      if (/^[a-z]{1,2}$/.test(text)) return false
      if (STOP_WORDS.has(text.toLowerCase())) return false
      return true
    }

    function extractKeywords(text) {
      if (!text) return []
      let source = String(text)
      source = source
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`\n]*`/g, ' ')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/\b[0-9a-f]{8,}\b/gi, ' ')

      const counts = new Map()
      const add = (word, weight) => {
        if (!keywordCandidate(word)) return
        const key = String(word).trim()
        counts.set(key, (counts.get(key) || 0) + weight)
      }

      const quoted = source.match(/[「“"'《【]([^」”"'》】]{2,18})[」”"'》】]/g) || []
      for (const token of quoted) {
        add(token.replace(/^[「“"'《【]|[」”"'》】]$/g, ''), 4)
      }

      try {
        const segmenter = new Intl.Segmenter('zh', { granularity: 'word' })
        for (const part of segmenter.segment(source)) {
          if (!part.isWordLike) continue
          add(part.segment, 1)
        }
      } catch {
        const latin = source.match(/[A-Za-z][A-Za-z0-9+#._-]{2,}/g) || []
        for (const word of latin) add(word, 1)
        const runs = source.match(/[\u4e00-\u9fff]{2,}/g) || []
        for (const run of runs) {
          for (let size = 2; size <= 3; size++) {
            for (let index = 0; index + size <= run.length; index++) add(run.slice(index, index + size), 1)
          }
        }
      }

      const runs = source.match(/[\u4e00-\u9fff]{2,}/g) || []
      const gramCounts = new Map()
      for (const run of runs) {
        for (let size = 3; size <= 4; size++) {
          for (let index = 0; index + size <= run.length; index++) {
            const gram = run.slice(index, index + size)
            gramCounts.set(gram, (gramCounts.get(gram) || 0) + 1)
          }
        }
      }
      for (const [gram, count] of gramCounts) {
        if (count >= 2) add(gram, count)
      }

      const latin = source.match(/[A-Za-z][A-Za-z0-9+#._-]{2,}/g) || []
      for (const word of latin) add(word, 1)

      const scored = [...counts.entries()].map(([word, count]) => ({
        word,
        score: count * 3 + Math.min(word.length, 6) + (/[A-Za-z]/.test(word) ? 1 : 0),
      }))
      scored.sort((left, right) => right.score - left.score || right.word.length - left.word.length)

      const picked = []
      for (const item of scored) {
        if (picked.some((word) => word.includes(item.word) || item.word.includes(word))) continue
        picked.push(item.word)
        if (picked.length >= 4) break
      }
      return picked
    }

    /** Reasoning text of the latest Turn's assistant steps. */
    function latestReasoningText(snapshot) {
      try {
        const timeline = snapshot && snapshot.timeline
        const order = timeline && timeline.turnOrder
        if (!Array.isArray(order) || order.length === 0) return ''
        const turn = order[order.length - 1]
        const locations = snapshot.locations
        const nodes = snapshot.nodes
        if (!locations || typeof locations.getTurn !== 'function' || !nodes || typeof nodes.get !== 'function') return ''
        const keys = locations.getTurn(turn)
        if (!Array.isArray(keys)) return ''
        const parts = []
        for (const key of keys) {
          const node = nodes.get(key)
          if (!node || node.kind !== 'assistant-step') continue
          const blocks = node.data && node.data.blocks
          if (!Array.isArray(blocks)) continue
          for (const block of blocks) {
            if (block && block.kind === 'reasoning' && typeof block.text === 'string' && block.text.trim() !== '') {
              parts.push(block.text)
            }
          }
        }
        return parts.join('\n').slice(-8000)
      } catch {
        return ''
      }
    }

    function readDemoSpend() {
      try {
        const raw = window.localStorage.getItem('dsh-fish-demo-cny')
        if (raw === null) return null
        const value = Number(raw)
        return Number.isFinite(value) && value >= 0 ? value : null
      } catch {
        return null
      }
    }

    function createSpendStore() {
      const listeners = new Set()
      let snapshot = {
        ready: false,
        offline: false,
        todayCny: 0,
        turnCny: 0,
        textColor: '',
        keywordColor: '',
        dayKey: '',
      }
      let timer = null
      let inFlight = false
      let currentSession = ''

      function publish(next) {
        if (
          next.ready === snapshot.ready &&
          next.offline === snapshot.offline &&
          next.todayCny === snapshot.todayCny &&
          next.turnCny === snapshot.turnCny &&
          next.textColor === snapshot.textColor &&
          next.keywordColor === snapshot.keywordColor &&
          next.dayKey === snapshot.dayKey
        ) {
          return
        }
        snapshot = next
        for (const listener of listeners) listener()
      }

      async function refresh() {
        if (inFlight) return
        inFlight = true
        try {
          const response = await fetch(ROUTE + '?t=' + Date.now() + '&session=' + encodeURIComponent(currentSession), {
            cache: 'no-store',
            headers: { accept: 'application/json' },
          })
          if (!response.ok) throw new Error('HTTP ' + response.status)
          const data = await response.json()
          if (!data || data.ok !== true) throw new Error('bad payload')
          const demo = readDemoSpend()
          const todayCny = Math.max(0, Number(data.todayCny) || 0)
          const hostTurnCny = Math.max(0, Number(data.turnCny) || 0)
          const turnCny = demo === null ? hostTurnCny : demo
          publish({
            ready: true,
            offline: false,
            todayCny,
            turnCny,
            textColor: typeof data.textColor === 'string' ? data.textColor : '',
            keywordColor: typeof data.keywordColor === 'string' ? data.keywordColor : '',
            dayKey: String(data.dayKey || ''),
          })
        } catch {
          publish({ ...snapshot, offline: true })
        } finally {
          inFlight = false
        }
      }

      function onVisibility() {
        if (document.visibilityState === 'visible') refresh()
      }

      function start() {
        if (timer !== null) return
        refresh()
        timer = window.setInterval(refresh, 8000)
        document.addEventListener('visibilitychange', onVisibility)
      }

      function stop() {
        if (timer !== null) {
          window.clearInterval(timer)
          timer = null
        }
        document.removeEventListener('visibilitychange', onVisibility)
      }

      return {
        subscribe(listener) {
          listeners.add(listener)
          start()
          return () => {
            listeners.delete(listener)
            if (listeners.size === 0) stop()
          }
        },
        getSnapshot() {
          return snapshot
        },
        setSession(sessionId) {
          const next = typeof sessionId === 'string' ? sessionId : ''
          if (next === currentSession) return
          currentSession = next
          refresh()
        },
        refresh,
      }
    }

    const spendStore = createSpendStore()

    function useSpend() {
      return React.useSyncExternalStore(spendStore.subscribe, spendStore.getSnapshot, spendStore.getSnapshot)
    }

    function useDebouncedValue(value, delay) {
      const [debounced, setDebounced] = React.useState(value)
      React.useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delay)
        return () => window.clearTimeout(timer)
      }, [value, delay])
      return debounced
    }

    function uniqueQuotes(list) {
      return Array.from(new Set(list))
    }

    function shuffleArray(list) {
      const copy = list.slice()
      for (let index = copy.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1))
        const current = copy[index]
        copy[index] = copy[swap]
        copy[swap] = current
      }
      return copy
    }

    function firstEntryText(entry) {
      if (!entry) return ''
      return entry.lines ? entry.lines[0] : entry.text
    }

    function orderEntries(entries, recentTexts, fallbackEntries) {
      const recent = new Set(Array.isArray(recentTexts) ? recentTexts : [])
      const pickFresh = (pool) => {
        const shuffled = shuffleArray(pool)
        const fresh = shuffled.filter((entry) => !recent.has(firstEntryText(entry)))
        return fresh.length > 0 ? fresh : shuffled
      }
      let ordered = pickFresh(entries)
      const allRecent = ordered.length > 0 && ordered.every((entry) => recent.has(firstEntryText(entry)))
      if (allRecent && Array.isArray(fallbackEntries) && fallbackEntries.length > 0) {
        ordered = pickFresh(fallbackEntries)
      }
      if (ordered.length > 1 && recent.has(firstEntryText(ordered[0]))) {
        const last = recentTexts[recentTexts.length - 1]
        if (firstEntryText(ordered[0]) === last) {
          const swap = 1 + Math.floor(Math.random() * (ordered.length - 1))
          const first = ordered[0]
          ordered[0] = ordered[swap]
          ordered[swap] = first
        }
      }
      return ordered
    }

    function buildEntries(pokeTier, spendTier, weekday) {
      if (pokeTier > 0) return uniqueQuotes(POKE_QUOTES[pokeTier]).map((text) => ({ text }))
      if (spendTier > 0) return uniqueQuotes(SPEND_QUOTES[spendTier]).map((text) => ({ text }))
      const seen = new Set()
      for (const list of Object.values(POKE_QUOTES)) {
        for (const text of list) seen.add(text)
      }
      for (const list of Object.values(SPEND_QUOTES)) {
        for (const text of list) seen.add(text)
      }
      const singles = []
      for (const text of [...WEEKDAY_QUOTES[weekday], ...BASIC_QUOTES]) {
        if (seen.has(text)) continue
        seen.add(text)
        singles.push({ text })
      }
      const chains = []
      for (const lines of CHAINS) {
        const unique = []
        for (const line of lines) {
          if (seen.has(line)) continue
          seen.add(line)
          unique.push(line)
        }
        if (unique.length > 1) chains.push({ lines: unique })
        else if (unique.length === 1) singles.push({ text: unique[0] })
      }
      return [...singles, ...chains]
    }

    function readStoredColors() {
      try {
        const raw = window.localStorage.getItem('dsh-fish-colors')
        if (!raw) return null
        const data = JSON.parse(raw)
        if (!data || typeof data !== 'object') return null
        return {
          textColor: typeof data.textColor === 'string' ? data.textColor : '',
          keywordColor: typeof data.keywordColor === 'string' ? data.keywordColor : '',
        }
      } catch {
        return null
      }
    }

    function writeStoredColors(colors) {
      try {
        if (colors === null) window.localStorage.removeItem('dsh-fish-colors')
        else window.localStorage.setItem('dsh-fish-colors', JSON.stringify(colors))
      } catch {
        /* a disabled localStorage only loses the local color override */
      }
    }

    function colorInputValue(value, fallback) {
      const text = typeof value === 'string' ? value.trim() : ''
      return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback
    }

    function shortColor(value) {
      const text = value ? String(value) : 'theme'
      return text.length > 18 ? text.slice(0, 18) + '…' : text
    }

    function ThoughtLine(props) {
      const { t, useSession, useChat, sessionId } = props
      const tr = typeof t === 'function' ? t : (key) => key
      const spend = useSpend()
      const running = useSession((snapshot) => Boolean(snapshot && snapshot.running))
      const reasoning = useChat(latestReasoningText)
      const stableReasoning = useDebouncedValue(reasoning, 700)
      const keywords = React.useMemo(() => extractKeywords(stableReasoning), [stableReasoning])
      const keywordSignature = keywords.join('|')

      const [override, setOverride] = React.useState('')
      const [clickTimes, setClickTimes] = React.useState([])
      const [storedColors, setStoredColors] = React.useState(() => readStoredColors())
      const [settingsOpen, setSettingsOpen] = React.useState(false)
      const keywordBankRef = React.useRef([])
      const shownKeywordsRef = React.useRef(new Set())
      const recentTextsRef = React.useRef([])
      const settingsRef = React.useRef(null)
      const popoverRef = React.useRef(null)

      const weekday = (new Date().getDay() + 6) % 7
      const spendTier = spend.turnCny >= 30 ? 30 : spend.turnCny >= 10 ? 10 : spend.turnCny >= 5 ? 5 : 0
      const recentClicks = clickTimes.filter((time) => Date.now() - time < 60000).length
      const pokeTier = recentClicks > 20 ? 20 : recentClicks > 10 ? 10 : recentClicks > 5 ? 5 : 0

      const entries = React.useMemo(() => buildEntries(pokeTier, spendTier, weekday), [pokeTier, spendTier, weekday])
      const fallbackEntries = React.useMemo(() => buildEntries(0, 0, weekday), [weekday])
      const [order, setOrder] = React.useState(() => orderEntries(entries, recentTextsRef.current, fallbackEntries))
      const [cursor, setCursor] = React.useState(0)
      const [chainIndex, setChainIndex] = React.useState(0)

      const effectiveTextColor = storedColors ? storedColors.textColor : spend.textColor
      const effectiveKeywordColor = storedColors ? storedColors.keywordColor : spend.keywordColor

      React.useEffect(() => {
        spendStore.setSession(sessionId)
      }, [sessionId])

      React.useEffect(() => {
        setOrder(orderEntries(entries, recentTextsRef.current, fallbackEntries))
        setCursor(0)
        setChainIndex(0)
      }, [entries, fallbackEntries])

      React.useEffect(() => {
        if (!running) return
        setClickTimes([])
        setCursor(0)
        setChainIndex(0)
        setOverride('')
        keywordBankRef.current = []
        shownKeywordsRef.current = new Set()
        recentTextsRef.current = []
        setSettingsOpen(false)
        spendStore.refresh()
      }, [running])

      React.useEffect(() => {
        if (!running) return
        if (keywords.length === 0) return
        const bank = keywordBankRef.current
        for (const word of keywords) {
          if (!bank.includes(word)) bank.push(word)
        }
        if (bank.length > 24) bank.splice(0, bank.length - 24)
      }, [running, keywordSignature])

      React.useEffect(() => {
        if (!running) return undefined
        const timer = window.setInterval(() => {
          setClickTimes((previous) => {
            const next = previous.filter((time) => Date.now() - time < 60000)
            return next.length === previous.length ? previous : next
          })
        }, 5000)
        return () => window.clearInterval(timer)
      }, [running])

      React.useEffect(() => {
        if (!settingsOpen) return undefined
        const onPointer = (event) => {
          if (settingsRef.current && !settingsRef.current.contains(event.target)) setSettingsOpen(false)
        }
        const onKey = (event) => {
          if (event.key === 'Escape') setSettingsOpen(false)
        }
        document.addEventListener('pointerdown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('pointerdown', onPointer)
          document.removeEventListener('keydown', onKey)
        }
      }, [settingsOpen])

      React.useEffect(() => {
        const element = popoverRef.current
        if (!element) return
        try {
          const open = typeof element.matches === 'function' && element.matches(':popover-open')
          if (settingsOpen && !open && typeof element.showPopover === 'function') element.showPopover()
          if (!settingsOpen && open && typeof element.hidePopover === 'function') element.hidePopover()
        } catch {
          /* the native popover API can reject a stale show/hide race */
        }
      }, [settingsOpen])

      const style = {}
      if (effectiveTextColor) style['--dsh-thought-color'] = effectiveTextColor
      if (effectiveKeywordColor) style['--dsh-thought-keyword'] = effectiveKeywordColor

      const currentEntry = order.length > 0 ? order[cursor % order.length] : undefined
      const thought = currentEntry
        ? currentEntry.lines
          ? currentEntry.lines[Math.min(chainIndex, currentEntry.lines.length - 1)]
          : currentEntry.text
        : ''

      const rememberThought = (text) => {
        if (!text) return
        const next = recentTextsRef.current.filter((item) => item !== text)
        next.push(text)
        if (next.length > 18) next.splice(0, next.length - 18)
        recentTextsRef.current = next
      }

      React.useEffect(() => {
        if (!running) return
        rememberThought(thought)
      }, [thought, running])

      if (!running) return null

      function advanceEntry() {
        if (currentEntry && currentEntry.lines && chainIndex < currentEntry.lines.length - 1) {
          const nextLine = currentEntry.lines[chainIndex + 1]
          if (!recentTextsRef.current.includes(nextLine)) {
            setChainIndex(chainIndex + 1)
            return
          }
        }
        const nextCursor = cursor + 1
        if (nextCursor < order.length) {
          setCursor(nextCursor)
          setChainIndex(0)
        } else {
          setOrder(orderEntries(entries, recentTextsRef.current, fallbackEntries))
          setCursor(0)
          setChainIndex(0)
        }
      }

      function nextThought(event) {
        event.stopPropagation()
        setSettingsOpen(false)
        const now = Date.now()
        const recent = clickTimes.filter((time) => now - time < 60000)
        recent.push(now)
        setClickTimes(recent)
        const bank = keywordBankRef.current
        const unshown = override ? [] : bank.filter((word) => !shownKeywordsRef.current.has(word))
        if (unshown.length >= 3) {
          const picked = unshown[Math.floor(Math.random() * unshown.length)]
          for (const word of unshown) shownKeywordsRef.current.add(word)
          setOverride(picked)
        } else {
          setOverride('')
          advanceEntry()
        }
        spendStore.refresh()
      }

      function updateColors(patch) {
        const next = {
          textColor: effectiveTextColor || '',
          keywordColor: effectiveKeywordColor || '',
          ...(storedColors || {}),
          ...patch,
        }
        setStoredColors(next)
        writeStoredColors(next)
      }

      function resetColors() {
        setStoredColors(null)
        writeStoredColors(null)
      }

      const settingsLabel = tr('settings')

      return h(
        'div',
        { className: 'dsh-thought-dock', style, 'data-dsh-thought-fish': '' },
        h('style', null, `
          .dsh-thought-dock { position: relative; width: 100%; height: 0; pointer-events: none; }
          .dsh-thought-wrap { position: absolute; right: 180px; bottom: 9px; display: flex; align-items: center; gap: 5px; max-width: min(400px, 46vw); z-index: 30; pointer-events: auto; }
          .dsh-thought-line { order: 1; position: static; display: inline-flex; align-items: baseline; justify-content: flex-end; max-width: min(360px, 40vw); padding: 1px 2px; border: 0; border-radius: 6px; background: transparent; color: var(--dsh-thought-color, var(--dsw-alias-label-secondary)); font: inherit; text-align: right; cursor: pointer; pointer-events: auto; }
          .dsh-thought-line:hover .dsh-thought-text { text-decoration: underline; text-decoration-style: dotted; text-underline-offset: 3px; }
          .dsh-thought-line:focus-visible, .dsh-thought-gear:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
          .dsh-thought-text { min-width: 0; font-size: 11.5px; line-height: 1.45; color: var(--dsh-thought-color, var(--dsw-alias-label-primary)); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
          .dsh-thought-keyword { color: var(--dsh-thought-keyword, var(--dsh-thought-color, var(--dsw-alias-brand-primary))); font-weight: 600; }
          .dsh-thought-gear { order: 2; flex: none; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--dsw-alias-label-secondary); opacity: .6; cursor: pointer; }
          .dsh-thought-wrap:hover .dsh-thought-gear, .dsh-thought-gear:focus-visible, .dsh-thought-gear[aria-expanded="true"] { opacity: 1; }
          .dsh-thought-gear:hover { background: var(--dsw-alias-bg-layer-2); }
          .dsh-thought-settings { position: fixed; inset: auto; right: 190px; bottom: 210px; z-index: 80; margin: 0; display: flex; flex-direction: column; gap: 7px; width: 236px; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-overlay); box-shadow: 0 8px 28px rgba(0,0,0,.18); color: var(--dsw-alias-label-primary); }
          .dsh-thought-settings:not(:popover-open) { display: none !important; }
          .dsh-thought-field { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 11px; }
          .dsh-thought-field-label { display: flex; align-items: baseline; gap: 4px; }
          .dsh-thought-hex { font-size: 9px; opacity: .55; font-family: ui-monospace, monospace; }
          .dsh-thought-field input[type="color"] { width: 36px; height: 22px; padding: 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: 5px; background: transparent; cursor: pointer; }
          .dsh-thought-reset { align-self: flex-start; padding: 0; border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11px; cursor: pointer; }
          .dsh-thought-reset:hover { text-decoration: underline; }
          @media (max-width: 900px) { .dsh-thought-wrap { right: 150px; max-width: 52vw; } .dsh-thought-line { max-width: 44vw; } .dsh-thought-settings { right: 150px; } }
        `),
        h(
          'div',
          { className: 'dsh-thought-wrap', ref: settingsRef },
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-thought-gear',
              onClick: (event) => {
                event.stopPropagation()
                setSettingsOpen((value) => !value)
              },
              title: settingsLabel,
              'aria-label': settingsLabel,
              'aria-expanded': settingsOpen ? 'true' : 'false',
            },
            h(
              'svg',
              { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': true },
              h('path', {
                d: 'M8 1.5a6.5 6.5 0 1 0 0 13c.7 0 1.2-.5 1.2-1.2 0-.6-.4-1-.9-1.3-.4-.3-.6-.6-.6-1 0-.7.5-1.2 1.2-1.2h1.4A4.2 4.2 0 0 0 14.5 5C14.5 2.9 11.6 1.5 8 1.5Z',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.1,
                strokeLinejoin: 'round',
              }),
              h('circle', { cx: 5, cy: 6, r: 0.9, fill: 'currentColor' }),
              h('circle', { cx: 7.5, cy: 4.2, r: 0.9, fill: 'currentColor' }),
              h('circle', { cx: 10.2, cy: 5.3, r: 0.9, fill: 'currentColor' }),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-thought-line',
              onClick: nextThought,
              title: tr('next'),
              'aria-label': tr('next'),
            },
            override
              ? h(
                  'span',
                  { className: 'dsh-thought-text', 'aria-live': 'polite' },
                  h('span', { className: 'dsh-thought-keyword' }, override),
                  h('span', null, tr('keywordSuffix')),
                )
              : h('span', { className: 'dsh-thought-text', 'aria-live': 'polite' }, thought),
          ),
          h(
            'div',
            {
              className: 'dsh-thought-settings',
              role: 'dialog',
              'aria-label': settingsLabel,
              popover: 'manual',
              ref: popoverRef,
            },
                h(
                  'label',
                  { className: 'dsh-thought-field' },
                  h(
                    'span',
                    { className: 'dsh-thought-field-label' },
                    h('span', null, tr('textColor')),
                    h('span', { className: 'dsh-thought-hex' }, shortColor(effectiveTextColor)),
                  ),
                  h('input', {
                    type: 'color',
                    value: colorInputValue(effectiveTextColor, '#e8a33d'),
                    onChange: (event) => updateColors({ textColor: event.target.value }),
                  }),
                ),
                h(
                  'label',
                  { className: 'dsh-thought-field' },
                  h(
                    'span',
                    { className: 'dsh-thought-field-label' },
                    h('span', null, tr('keywordColor')),
                    h('span', { className: 'dsh-thought-hex' }, shortColor(effectiveKeywordColor)),
                  ),
                  h('input', {
                    type: 'color',
                    value: colorInputValue(effectiveKeywordColor, '#4aa8e8'),
                    onChange: (event) => updateColors({ keywordColor: event.target.value }),
                  }),
                ),
                h(
                  'button',
                  { type: 'button', className: 'dsh-thought-reset', onClick: resetColors },
                  tr('reset'),
                ),
          ),
        ),
      )
    }

    const zh = {
      next: '点一下，换下一句想法',
      keywordSuffix: '吗？',
      settings: '颜色设置',
      textColor: '文字颜色',
      keywordColor: '关键词颜色',
      reset: '恢复默认',
    }
    const en = {
      next: 'Click for the next thought',
      keywordSuffix: '?',
      settings: 'Color settings',
      textColor: 'Text color',
      keywordColor: 'Keyword color',
      reset: 'Reset to default',
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }))
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'thought-fish-bubble', order: 15, locale: NS },
            ThoughtLine,
          ),
        )
      },
    }
  },
})
