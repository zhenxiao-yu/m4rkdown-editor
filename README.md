# M4rkdown

**Fast, offline-first Markdown editor** with real-time collaboration and a competitive typing arena.

[![Deploy](https://github.com/zhenxiao-yu/m4rkdown-editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/zhenxiao-yu/m4rkdown-editor/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.1.0-blue)](CHANGELOG.md)
[![Live](https://img.shields.io/badge/live-m4rkdown.is--a.dev-brightgreen)](https://m4rkdown.is-a.dev)

> **Live demo:** [m4rkdown.is-a.dev](https://m4rkdown.is-a.dev) (also reachable at [m4rkdown.vercel.app](https://m4rkdown.vercel.app))

M4rkdown is a browser-based Markdown editor that works without an internet
connection. Install it as a PWA and your documents stay on your device; open a
share link and you can co-edit a document in real time; or step into the typing
arena for a survival word game you can play solo or with up to eight people.
It is built for writers and developers who want a quick, distraction-free editor
that they own — no account, no server-side storage of your text.

---

## Screenshots

> No UI screenshots are committed to the repository yet. The fastest way to see
> M4rkdown is the [live demo](https://m4rkdown.is-a.dev). To add screenshots
> later, drop image files into a `docs/` folder and reference them from this
> section.

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

### Collaboration & arena

| Feature | Detail |
|---------|--------|
| Real-time collab | Share a URL, co-edit with live presence indicators |
| Typing Arena | Survival word game — words fall, type to destroy them |
| Solo practice | Daily challenge (consistent daily seed) + difficulty selector |
| Multiplayer rooms | Create / join / browse public rooms, up to 8 players |
| XP & leveling | 10 levels, confetti ceremonies, 14 achievements |
| Reconnect recovery | Auto-rejoin mid-game with HP/score/combo preserved (30-second window) |

### Platform

- **PWA** — installable, works offline via a Workbox service worker.
- **PartyKit** — WebSocket server that powers the arena and collab presence.
- **Vercel** — hosting, analytics, and speed insights. The social card (OG image)
  is generated at build time by `scripts/gen-og.mjs`.

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
| Hosting | Vercel |

---

## Run locally

**Prerequisites:** Node 22 (LTS) and npm.

```bash
npm install
```

The scripts below come straight from `package.json`:

```bash
# Editor only
npm run dev           # Vite dev server, http://localhost:5173

# Arena / collab server (needed for multiplayer and live collab)
npm run arena:dev     # PartyKit dev server, http://localhost:1999

# Type check
npm run typecheck

# Tests
npm test              # one-shot (vitest run)
npm run test:watch    # watch mode

# Production build (generates icons + OG image, type-checks, then builds)
npm run build
npm run preview       # serve the production build locally
```

You only need `npm run dev` for plain editing. Run `npm run arena:dev` in a
second terminal when you want to test the typing arena or real-time collab.

### Environment variables

Copy the example file and adjust if needed (defaults work for local editing):

```bash
cp .env.example .env.local
```

| Variable | Purpose | Local default |
|----------|---------|---------------|
| `VITE_PARTYKIT_HOST` | Host of the PartyKit arena/collab server | `localhost:1999` |
| `VITE_SITE_URL` | Canonical site URL used in OG meta tags (no trailing slash) | `http://localhost:5173` |

Deploy the PartyKit server with `npm run arena:deploy` (`npx partykit deploy`),
then point `VITE_PARTYKIT_HOST` at the deployed host for production.

---

## Deploy

Pushing to `main` triggers the `Deploy` GitHub Actions workflow
(`.github/workflows/deploy.yml`), which:

1. Type-checks and runs tests.
2. Generates PWA icons and the OG image (graceful fallback if native addons are unavailable).
3. Pulls Vercel env vars and builds once with `vercel build --prod`.
4. Deploys the prebuilt output to Vercel and GitHub Pages in parallel, and
   redeploys the PartyKit server when server-side files change.

Required GitHub secrets: `VERCEL_TOKEN`, `PARTYKIT_TOKEN`.

To cut a release, push a semver tag — the release workflow creates a GitHub
Release automatically:

```bash
git tag v3.1.0 && git push origin v3.1.0
```

---

## Project structure

```
src/
  app.tsx              # Root — routes between menu / editor / arena
  components/          # AppLayout, BattleLayout, arena views, toolbar, etc.
  core/                # Markdown parse / render / tokenizer
  store/               # Global signals (documents, layout, settings, arena stats)
  lib/                 # CodeMirror commands, game engine, PartyKit client, SFX
  workers/             # parser.worker.ts — off-main-thread Markdown parsing
  styles/              # main.css (editor) + arena.css (battle mode) + preview.css
party/
  index.ts             # PartyKit survival-game server
  collab.ts            # PartyKit collab presence server
scripts/
  gen-icons.mjs        # PWA icon generation from SVG (requires sharp)
  gen-og.mjs           # Static OG image generation (graceful fallback)
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, stack
constraints, and the PR process. Bug reports and feature requests go through
[GitHub Issues](https://github.com/zhenxiao-yu/m4rkdown-editor/issues).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full release history. The current
release is **3.1.0**.

## License

Released under the [MIT License](LICENSE).
