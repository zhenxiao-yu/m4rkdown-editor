# Contributing to M4rkdown

Thanks for your interest in contributing! This document covers everything you need to get up and running.

## Prerequisites

- Node.js 22+ (LTS recommended)
- npm 10+
- A PartyKit account (optional — only needed for arena/collab development)

## Dev setup

```bash
git clone https://github.com/zhenxiao-yu/m4rkdown-editor
cd m4rkdown-editor
npm install

# Editor only
npm run dev           # http://localhost:5173

# With arena / collab server
npm run arena:dev     # PartyKit server at http://localhost:1999
# (open a second terminal for the Vite dev server)
```

## Stack constraints — read before writing code

M4rkdown has some non-obvious constraints that cause hard-to-debug issues if ignored:

| Constraint | Why it matters |
|------------|---------------|
| **Preact 10**, not React | All hooks come from `preact/hooks`. Never import from `react`. |
| **`@preact/signals`** for shared state | Module-level `signal()` propagates reactively without prop drilling. Never use `useState` for state that crosses component boundaries. |
| **`@replit/codemirror-vim`** (not `@codemirror/vim`) | The `@codemirror/vim` package 404s on npm. The Replit fork is the correct one. |
| **No Tailwind utility classes in JSX** | CSS lives in `src/styles/main.css` (editor) and `src/styles/arena.css` (battle mode). Inline styles or class names only. |
| **PartySocket buffers while CONNECTING** | Never guard `socket.send()` on `readyState`. PartySocket queues sends automatically. |
| **`recordGame()` once per session** | It mutates localStorage. Use a `useRef(false)` guard to call it exactly once per game session. |

See [CLAUDE.md](./CLAUDE.md) for the full architecture reference.

## Making changes

### Before you start

Search existing issues and PRs to avoid duplicating effort. For non-trivial features, open an issue first to discuss the approach.

### Workflow

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` — zero errors required
4. Run `npm test` — all tests must pass
5. Test in browser: golden path + the edge cases your change touches
6. Push and open a PR using the provided template

### Code style

- No comments unless the **why** is non-obvious
- No `console.log` / `console.error` in production paths
- No error handling for impossible scenarios — trust framework guarantees
- Match the file's existing indentation (2 spaces)
- Keep components focused; extract logic into `src/lib/` functions

### Arena changes

If you touch arena code:
- Test with both **solo** mode and a **local multiplayer** session (open two browser tabs, use `npm run arena:dev`)
- If you touch `party/index.ts`, run `npx partykit dev` and verify the server handles the edge cases: player disconnect mid-game, host leaving, room full

## Running tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests live in `src/__tests__/`. Add tests for new utility functions in `src/lib/`.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add word goal progress bar to status bar
fix: tooltip clips above viewport in header
docs: update CONTRIBUTING with arena setup steps
chore: bump @preact/signals to 2.9.0
```

## Need help?

Open a [Discussion](https://github.com/zhenxiao-yu/m4rkdown-editor/discussions) — it's the best place for questions.
