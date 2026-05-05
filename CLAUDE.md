# M4rkdown Editor — Claude Code Guide

## Project in one sentence
A fast, offline-first Markdown editor PWA built on Preact + CodeMirror 6 + markdown-it, with a real-time typing arena powered by PartyKit WebSockets.

## Commands
```
npx vite              # dev server (localhost:5173)
npx tsc --noEmit      # typecheck — run before every commit
npx vite build        # production build (typecheck is baked in via the npm build script)
npx vitest run        # unit tests
npx partykit dev      # arena / collab server (localhost:1999)
```

## Stack constraints — read before touching anything

| Thing | Correct | Wrong |
|-------|---------|-------|
| UI framework | **Preact 10** — hooks from `preact/hooks` | React hooks / ReactDOM |
| State | **`@preact/signals`** — `signal()`, `computed()`, `effect()` at module level | `useState` for shared state |
| Vim extension | **`@replit/codemirror-vim`** | `@codemirror/vim` (404s on npm) |
| CSS | `src/styles/main.css` (editor) + `src/styles/arena.css` (battle mode) — no Tailwind utility classes in JSX | inline Tailwind |
| Icon library | `lucide-react` (works via Preact alias in vite.config.ts) | any other icon pack |
| Signals pattern | module-level `const foo = signal(x)` — reactive automatically | storing signals inside components |

## Architecture

```
src/
  app.tsx              ← root: lazy-loads AppLayout or BattleLayout based on appMode signal
  store/               ← all global signals live here (documents, editor, layout, settings, arena*)
  components/
    AppLayout.tsx       ← editor shell (header, tabs, split pane, status bar)
    BattleLayout.tsx    ← arena shell (header with level badge, reconnect overlay, aurora bg)
    arena/              ← HomeView, LobbyView, CountdownView, GameView, SurvivalGame,
                          SoloPracticeView, ResultsView
  lib/
    game-engine.ts      ← generateWordQueue(), wordProgress(), wordScore()
    partykit-client.ts  ← WebSocket with exponential-backoff reconnect (3 attempts)
    sfx.ts              ← procedural Web Audio SFX — zero npm cost
  styles/
    main.css            ← editor + global design tokens
    arena.css           ← battle-mode only styles
party/
  index.ts             ← PartyKit survival-game server
  collab.ts            ← PartyKit collab presence server
```

## Key signals

| Signal | File | Purpose |
|--------|------|---------|
| `appMode` | `store/appMode.ts` | `'menu' \| 'editor' \| 'battle'` — top-level routing |
| `layoutMode` | `store/layout.ts` | `'editor' \| 'split' \| 'preview'` |
| `zenMode` | `store/settings.ts` | fullscreen writing mode |
| `arenaView` | `store/arena.ts` | `'home' \| 'lobby' \| 'countdown' \| 'game' \| 'results'` |
| `arenaReconnecting` | `store/arena.ts` | WebSocket reconnect state |
| `playerStats` / `playerLevel` | `store/arena-stats.ts` | XP/leveling — **already fully built, just needs UI wiring** |

## Patterns used in this codebase

**Compartments for hot-swappable CodeMirror extensions:**
```ts
const themeComp = new Compartment();
// later:
view.dispatch({ effects: themeComp.reconfigure(newExtension) });
```

**Lazy vim import (avoids bundle cost when unused):**
```ts
import('@replit/codemirror-vim').then(({ vim }) => { ... });
```

**Signal effects inside useEffect (cleanup returned):**
```ts
useEffect(() => {
  const stop = effect(() => { /* reads signals reactively */ });
  return stop;
}, []);
```

**RAF tick loop with pause/resume on tab visibility:**
Pattern is established in `SurvivalGame.tsx` and `SoloPracticeView.tsx`. Copy that pattern.

**Reconnect guard:** `partykit-client.ts` uses a `currentSocketId` counter. Increment it before closing to invalidate pending reconnect timeouts. Do not break this invariant.

## CSS design tokens (defined in main.css `:root`)
`--c-bg`, `--c-surface`, `--c-surface-alt`, `--c-surface-raised`, `--c-btn`, `--c-border`, `--c-border-strong`, `--c-text`, `--c-text-2`, `--c-muted`, `--c-accent`, `--c-accent-fg`, `--c-success`, `--c-danger`, `--c-link`

Arena-specific: `--game-correct` (#22c55e), `--game-combo` (#f7df4b), `--game-danger` (#ef4444)

## Things to never do

- **Never import from `react`** — this is Preact. The vite config aliases `react` → `preact/compat` but avoid the confusion.
- **Never use `useState` for signals** — signals auto-propagate without prop drilling. Use them.
- **Never call `recordGame()` more than once per game session** — it mutates localStorage stats. Use a `useRef(false)` guard.
- **Never skip `npx tsc --noEmit` before committing** — the build script enforces it but catch errors earlier.
- **Never add `console.log` / `console.error` in production paths** — all logging was removed in the demo-polish pass.
- **Never use `position: absolute` for the battle back button** — the header refactor fixed this; don't regress it.
- **Never store module-level mutable state that should be a signal** — it won't be reactive.

## Collab presence (real-time)
- `party/collab.ts` handles presence (peer count broadcast)
- `src/lib/partykit-client.ts` exports `connectToCollab()`, `disconnectFromCollab()`, `sendPresence()`
- `src/store/collab.ts` has `collabPeerCount` and `collabConnected` signals
- StatusBar shows peer count pill; ShareButton auto-joins the collab room on share

## Arena stats system (already built — just wire it)
`src/store/arena-stats.ts` has 10 levels, 14 achievements, `recordGame(result)` → returns `string[]` of newly unlocked achievement IDs. `playerLevel` and `playerXpInfo` are computed signals. To unlock an achievement toast: iterate returned IDs, find the `ACHIEVEMENTS` entry, call `showToast()`.
