# M4rkdown

**Fast, offline-first Markdown editor** with real-time collaboration and a competitive typing arena.

[![Deploy](https://github.com/zhenxiao-yu/m4rkdown-editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/zhenxiao-yu/m4rkdown-editor/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.1.0-blue)](CHANGELOG.md)
[![Live](https://img.shields.io/badge/live-m4rkdown.is--a.dev-brightgreen)](https://m4rkdown.is-a.dev)

---

## Features

### Editor
| Feature | Detail |
|---------|--------|
| CodeMirror 6 | Syntax highlighting, bracket matching, multi-cursor |
| Vim keybindings | Normal / Insert / Visual modes with status bar label |
| Formatting toolbar | Bold, italic, code, H1–H3, bullet/ordered lists, blockquote |
| Layout modes | Editor only / Split / Preview — keyboard shortcut `Ctrl+\` |
| Zen mode | Fullscreen writing, all chrome hidden (`Ctrl+Shift+F`) |
| Image paste | `Ctrl+V` a screenshot → inserts `![name](data:…)` at cursor |
| Word goal | Progress bar + confetti milestones at 25/50/75/100% |
| Markdown lint | Detects empty headings, unclosed fences, broken links, etc. |
| Preview themes | Default · GitHub · Serif · Minimal · Terminal |
| Outline sidebar | Heading tree for navigation in editor/split view |
| Document tabs | Multiple docs, localStorage persistence |
| Templates | 6 starter templates: Blog, Meeting Notes, README, Journal, TODO, Resume |
| Export | Copy as HTML · Download `.md` · Print / PDF |
| KaTeX math | Inline `$x^2$` and block `$$` LaTeX rendering |
| Mermaid diagrams | Fenced ` ```mermaid ` blocks render inline |

### Collaboration & Arena
| Feature | Detail |
|---------|--------|
| Real-time collab | Share a URL, co-edit with live presence indicators |
| Typing Arena | Survival word game — words fall, type to destroy them |
| Solo practice | Daily challenge (consistent daily seed) + difficulty selector |
| Multiplayer rooms | Create / join / browse public rooms, up to 8 players |
| XP & leveling | 10 levels, confetti ceremonies, 14 achievements |
| Reconnect recovery | Auto-rejoin mid-game with HP/score/combo preserved (30-second window) |

### Platform
- **PWA** — installable, fully offline-capable via service worker
- **Vercel** — edge functions, analytics, speed insights, OG social card
- **PartyKit** — WebSocket server for arena and collab presence

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | Preact 10 + @preact/signals |
| Editor | CodeMirror 6 |
| Markdown | markdown-it + KaTeX, Mermaid, highlight.js |
| Realtime | PartyKit (WebSockets) |
| Build | Vite 5 + TypeScript |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Vercel (edge functions, analytics) |

---

## Local development

```bash
npm install

# Editor only
npm run dev           # http://localhost:5173

# Arena / collab server (needed for multiplayer)
npm run arena:dev     # http://localhost:1999

# Type check
npm run typecheck

# Tests
npm test
```

## Deploy

Push to `main` — the GitHub Actions workflow:

1. Type-checks and runs tests
2. Generates PWA icons and OG image (graceful fallback if unavailable)
3. Pulls Vercel env vars and builds once with `vercel build --prod`
4. Deploys the prebuilt output to Vercel, GitHub Pages, and PartyKit in parallel

Required GitHub secrets: `VERCEL_TOKEN`, `PARTYKIT_TOKEN`.

To cut a release, push a semver tag — the release workflow creates a GitHub Release automatically:

```bash
git tag v3.1.0 && git push origin v3.1.0
```

## Project structure

```
src/
  app.tsx              # Root — routes between menu / editor / arena
  components/          # AppLayout, BattleLayout, arena views, toolbar, etc.
  store/               # Global signals (documents, layout, settings, arena stats)
  lib/                 # CodeMirror commands, game engine, PartyKit client, SFX
  styles/              # main.css (editor) + arena.css (battle mode)
party/
  index.ts             # PartyKit survival-game server
  collab.ts            # PartyKit collab presence server
api/
  og.tsx               # Vercel Edge Function — OG social card image
scripts/
  gen-icons.mjs        # PWA icon generation from SVG (requires sharp)
  gen-og.mjs           # Static OG image generation (graceful fallback)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, stack constraints, and the PR process. Bug reports and feature requests go through [GitHub Issues](https://github.com/zhenxiao-yu/m4rkdown-editor/issues).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## License

[MIT](LICENSE) — © 2026 Zhenxiao (Mark) Yu
