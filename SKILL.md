---
name: thought-fish
description: Use when the user wants a decorative DeepSeek thought line to the right of the live "Deep diving" row in the DSH Web UI, with keyword questions, randomized quotes, per-turn spend reactions, and adjustable colors.
---

# Thought Fish

This folder is both a DSH bundle and a skill resource; `SKILL.md` is the skill, the rest is the bundle.

## Install

- Install the folder as a bundle with `plugin_manager` `install_bundle`; `target` is this folder.
- The bundle row id is `thought-fish`.
- After editing `client.js`, reload the page or toggle the bundle so the browser module is rebuilt.

## Behavior

- Adds only one text line to the right of the live Deep-diving row. It does not replace reasoning, the built-in whale, or any other host row.
- Click the line for the next quote: a shuffled bag avoids consecutive repeats; chain groups appear as random blocks but keep their internal order.
- Click the palette to the right of the line for text/keyword color pickers. The panel is hidden by default, opens above the line without covering it, and closes on outside click, Escape, or another line click. Colors are stored in browser `localStorage`.
- Keywords from reasoning are collected silently; nothing changes on screen while thinking. After at least 3 new keywords accumulate, the next click may show `{keyword}吗？` with the keyword highlighted; the following click resumes quotes.
- Per-turn estimated spend selects the 5 / 10 / 30 CNY quote groups; rapid clicks select the poke groups; weekday and chained quote groups fill the normal rotation.

## Privacy

- No outbound network requests. The browser only calls the same-origin local route `/dsh-fish/state`.
- Reasoning and user prompts are parsed only in the browser for keyword display; they are never persisted or uploaded.
- The local ledger stores date, CNY, color defaults, opaque session ids and sequence watermarks only; no prompts, reasoning text, or message content.
- Color overrides are stored only in browser `localStorage`.
- The package contains no screenshots, chat logs, usernames, absolute user paths, or credentials.

## Verify

- `GET /dsh-fish/state?session=<id>` returns `{ todayCny, turnCny, textColor, keywordColor }`.
- The Client slot `conversation.input.dock` shows an active `thought-fish-bubble` occupant.
- Click the palette: the settings panel appears above the line, shows both current hex values, applies changes immediately, and `恢复默认` clears the local override.
