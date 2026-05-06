# Changelog

All notable changes to M4rkdown are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versions follow [Semantic Versioning](https://semver.org/).

---

## [3.1.0] — 2026-05-05

### Fixed
- **Header tooltips** now render *below* the button instead of above the viewport edge
- **Arena reconnect**: client auto-resends `join` on WebSocket reconnect; server restores player state (HP, score, combo) within a 30-second window — players rejoin mid-game without losing progress
- **Host promotion**: new host receives a `host_changed` message immediately; `arenaIsHost` is now derived reactively from every `roster` update, eliminating stale state
- **Room error messages** are now specific: ROOM_FULL includes the player limit, GAME_IN_PROGRESS explains next steps, NAME_TAKEN repeats the conflicting name
- Error bar has a dismiss `×` button; `arenaConnecting` resets on dismiss so the join form re-enables

### Added
- `recentlyLeft` map in the PartyKit server — tracks disconnected players for rejoin window cleanup
- `host_changed` server message type for explicit host promotion notification

---

## [3.0.0] — 2026-04-28

### Added
- **Typing Arena** — full survival word game with falling words, HP, combo multiplier
- **Solo Practice** — daily challenge with consistent seed, difficulty selector (Easy → Expert)
- **Multiplayer rooms** — create/join/browse public rooms, real-time WebSocket gameplay via PartyKit
- **XP / Leveling** — 10 levels, confetti ceremonies, achievement toasts (14 achievements)
- **Player profile card** with XP progress bar in HomeView
- **Game history** — last 20 sessions stored in localStorage with WPM, accuracy, score
- **Achievement gallery** — locked/unlocked grid in HomeView
- **Custom word import** — `.txt` file or paste; min 20 words, deduplication, length-based tier assignment
- **Level-up ceremony** — full-overlay badge animation with confetti on level-up
- **Reconnect overlay** — spinner + attempt counter; exponential backoff (1s, 2s, 4s); 3 retries before fallback error

### Fixed
- Production WebSocket failures caused by incorrect `VITE_PARTYKIT_HOST` in `.env.production`
- `readyState` guard in `sendMsg` was silently dropping the join message on fast connections

---

## [2.1.0] — 2026-04-15

### Added
- **Zen / fullscreen mode** — hides all chrome, syncs with browser Fullscreen API (`Ctrl+Shift+F`)
- **Layout mode toggle** — Editor / Split / Preview with keyboard shortcut (`Ctrl+\`) and persistence
- **Synchronized scroll** — editor and preview scroll in proportion in split view
- **Vim keybindings** — `@replit/codemirror-vim`; Normal / Insert / Visual mode label in status bar
- **Word goal tracker** — progress bar below status bar, popover input, confetti at 25 / 50 / 75 / 100%
- **Markdown lint panel** — detects empty headings, unclosed fences, multiple H1s, etc.
- **Preview themes** — Default, GitHub, Serif, Minimal, Terminal
- **Document templates** — 6 templates (Blog Post, Meeting Notes, README, Journal, TODO, Resume)
- **Keyboard shortcuts modal** — `?` key; full reference of all shortcuts
- **Settings modal** — centralized panel for all toggle preferences
- **Image paste / drag-drop** — inserts `![name](data:...)` at cursor
- **Print / PDF export** — clean A4 print stylesheet hides all editor chrome
- **Heading / list / blockquote toolbar buttons** — H1–H3, bullet list, ordered list, blockquote
- **Outline sidebar** — heading tree for navigation in editor/split view
- **Real-time collab presence** — peer count pill in status bar; PartyKit collab room

---

## [2.0.0] — 2026-03-01

### Changed
- Full rewrite: Preact 10 + CodeMirror 6 + markdown-it replacing legacy architecture
- Signal-based state management with `@preact/signals`
- Vite 5 build pipeline with TypeScript strict mode
- PWA with Workbox service worker and offline support
- Vercel deployment with Edge Functions for OG image

---

[3.1.0]: https://github.com/zhenxiao-yu/m4rkdown-editor/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/zhenxiao-yu/m4rkdown-editor/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/zhenxiao-yu/m4rkdown-editor/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/zhenxiao-yu/m4rkdown-editor/releases/tag/v2.0.0
