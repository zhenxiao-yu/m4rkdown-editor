import type { ArenaPrompt } from './arena-types';

export const ARENA_PROMPTS: ArenaPrompt[] = [
  // ── Easy ─────────────────────────────────────────────────────────────
  {
    id: 'easy-1',
    title: 'Hello Markdown',
    difficulty: 'easy',
    estimatedWords: 28,
    content: `# Hello, World!

This is **bold** and this is _italic_ text.

- Item one
- Item two
- Item three

> A simple blockquote.`,
  },
  {
    id: 'easy-2',
    title: 'Simple Links',
    difficulty: 'easy',
    estimatedWords: 32,
    content: `## Resources

Visit [GitHub](https://github.com) for open source projects.

Here is some \`inline code\` and a [link](https://example.com).

**Note:** Always cite your sources.`,
  },
  {
    id: 'easy-3',
    title: 'Task List',
    difficulty: 'easy',
    estimatedWords: 24,
    content: `## My Todo List

- [x] Read the docs
- [x] Install dependencies
- [ ] Write tests
- [ ] Deploy to production`,
  },

  // ── Medium ────────────────────────────────────────────────────────────
  {
    id: 'medium-1',
    title: 'Code Snippet',
    difficulty: 'medium',
    estimatedWords: 40,
    content: `## Quick Sort in Python

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid  = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)
\`\`\`

Time complexity: **O(n log n)** average case.`,
  },
  {
    id: 'medium-2',
    title: 'Data Table',
    difficulty: 'medium',
    estimatedWords: 38,
    content: `## Browser Support

| Browser | Version | CSS Grid | WebSockets |
|---------|---------|----------|-----------|
| Chrome  | 100+    | Yes      | Yes       |
| Firefox | 98+     | Yes      | Yes       |
| Safari  | 15+     | Yes      | Yes       |
| Edge    | 100+    | Yes      | Yes       |`,
  },
  {
    id: 'medium-3',
    title: 'API Docs',
    difficulty: 'medium',
    estimatedWords: 45,
    content: `## \`POST /api/rooms\`

Creates a new arena room.

**Request body:**

\`\`\`json
{
  "hostName": "Alice",
  "promptId": "medium-1",
  "isPublic": true
}
\`\`\`

**Response \`201\`:**

\`\`\`json
{ "roomId": "M4-XK9" }
\`\`\`

> Rooms expire after 30 minutes of inactivity.`,
  },
  {
    id: 'medium-4',
    title: 'Callout Blocks',
    difficulty: 'medium',
    estimatedWords: 42,
    content: `## Deployment Notes

::: warning Breaking Change
The \`/api/v1\` endpoint is deprecated. Migrate to \`/api/v2\` by June 2025.
:::

::: tip Performance
Enable **gzip** compression to reduce transfer size by ~70%.
:::

::: danger
Never commit \`.env\` files to version control.
:::`,
  },

  // ── Hard ──────────────────────────────────────────────────────────────
  {
    id: 'hard-1',
    title: 'Full README',
    difficulty: 'hard',
    estimatedWords: 80,
    content: `# AwesomeLib

> A blazing-fast utility library for TypeScript developers.

## Installation

\`\`\`bash
npm install awesomelib
\`\`\`

## Usage

\`\`\`typescript
import { debounce } from 'awesomelib';

const handler = debounce((e: Event) => {
  console.log('fired!', e);
}, 300);

window.addEventListener('resize', handler);
\`\`\`

## API

| Function    | Description         |
|-------------|---------------------|
| \`debounce\`  | Delay execution     |
| \`throttle\`  | Limit execution rate |

## License

MIT © 2025`,
  },
  {
    id: 'hard-2',
    title: 'Math & Diagrams',
    difficulty: 'hard',
    estimatedWords: 50,
    content: `## The Fourier Transform

The continuous Fourier transform is defined as:

$$
\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\, e^{-2\\pi i x \\xi}\\, dx
$$

Where $f(x)$ is the input signal and $\\xi$ is the frequency.

\`\`\`mermaid
graph LR
  A[Time Domain] -->|FFT| B[Frequency Domain]
  B -->|IFFT| A
\`\`\`

This transformation underpins **signal processing** and audio analysis.`,
  },
  {
    id: 'hard-3',
    title: 'Tech Spec',
    difficulty: 'hard',
    estimatedWords: 90,
    content: `---
title: Arena WebSocket Protocol
version: 1.0.0
---

# Arena WebSocket Protocol

## Overview

All messages are JSON-encoded over a persistent WebSocket connection.

## Lifecycle

1. Client connects to \`wss://arena.example.com/party/:roomId\`
2. Server emits \`welcome\` with player ID and prompt
3. Host emits \`start\` — server schedules 3-second countdown
4. Server broadcasts \`countdown\` then \`game_start\`
5. Players emit \`progress\` on each keystroke
6. First player to finish emits \`finish\`
7. Server broadcasts \`game_over\` with final rankings

## Limits

- \`progress\` messages: **10/second** per client
- Maximum room size: **20 players**
- Room TTL: **30 minutes**`,
  },
];

export function getPromptById(id: string): ArenaPrompt | undefined {
  return ARENA_PROMPTS.find(p => p.id === id);
}

export function getRandomPrompt(difficulty?: ArenaPrompt['difficulty']): ArenaPrompt {
  const pool = difficulty
    ? ARENA_PROMPTS.filter(p => p.difficulty === difficulty)
    : ARENA_PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
