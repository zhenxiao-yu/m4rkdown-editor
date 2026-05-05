# M4rkdown

**Fast, offline-first Markdown editor** with real-time collaboration and a competitive typing arena.

🌐 **[m4rkdown.is-a.dev](https://m4rkdown.is-a.dev)**

---

## Features

- **Editor** — CodeMirror 6, syntax highlighting, vim mode, split / editor / preview layouts, zen fullscreen mode
- **Formatting toolbar** — bold, italic, code, headings (H1–H3), lists, blockquotes with keyboard shortcuts
- **Document tabs** — multiple docs, localStorage persistence, document templates
- **Real-time collab** — share a URL and co-edit with live presence indicators via PartyKit WebSockets
- **Typing Arena** — survival word game, solo practice, multiplayer rooms, XP / leveling system, achievements
- **PWA** — installable, fully offline-capable via service worker
- **Export** — copy as HTML, download as `.md`

## Tech stack

| Layer | Technology |
|-------|-----------|
| UI | Preact 10 + @preact/signals |
| Editor | CodeMirror 6 |
| Markdown | markdown-it + KaTeX, Mermaid, highlight.js plugins |
| Realtime | PartyKit (WebSockets) |
| Build | Vite 5 + TypeScript 6 |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Vercel (edge functions, analytics, speed insights) |

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
2. Pulls Vercel env vars and builds once with `vercel build --prod`
3. Deploys the prebuilt output to Vercel, GitHub Pages, and PartyKit in parallel

Required GitHub secrets: `VERCEL_TOKEN`, `PARTYKIT_TOKEN`.

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
```

## License

MIT
