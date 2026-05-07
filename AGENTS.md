# AGENTS.md

## Project Intent
M4rkdown is an offline-first markdown editor with real-time collaboration and a typing arena. Priorities are reliable writing safety, smooth local-first UX, and stable multiplayer behavior.

## Preferred Agent Workflow
1. Planner: inspect the affected editor, arena, PartyKit, and storage surfaces first.
2. Builder: keep document/editor changes separate from multiplayer/game changes when practical.
3. Reviewer: verify both local editing and the relevant real-time behavior before merge.

## Setup
```bash
npm install
npm run dev
npm run arena:dev
```

## Validation
```bash
npm run typecheck
npm test
npm run build
```
Run extra manual checks when changing autosave, recovery, room flows, exports, or PWA behavior.

## Guardrails
- Never commit secrets or populated env files.
- Preserve offline-first behavior, local recovery, and no-surprise writing safety.
- Keep multiplayer changes backward-compatible unless a task explicitly changes the protocol.
- Update README and release notes when commands, domains, or deploy flows change.

## Release Hygiene
- Use semver tags only after typecheck, tests, and build pass.
- Recheck deploy workflows, live URLs, and generated assets before release.