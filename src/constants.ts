export const DEFAULT_MARKDOWN = `---
title: Welcome to M4rkdown
author: M4rkdown
tags: [markdown, editor, pwa]
---

# Welcome to M4rkdown :wave:

A **fast**, _beautiful_, standalone markdown editor — works offline, no account needed.

${`$`}{toc}

---

## :sparkles: What's New in v2.1

::: tip New features
Focus mode, Typewriter mode, Outline sidebar, Math, Diagrams, Callouts, Emoji, Footnotes & more — all free, all client-side.
:::

---

## Text Formatting

**Bold**, _italic_, ~~strikethrough~~, \`inline code\`, and [links](https://github.com/zhenxiao-yu/m4rkdown-editor).

Footnotes are supported[^1] too — great for academic writing.

[^1]: This is a footnote. It appears at the bottom of the document.

---

## Math

Inline math: $E = mc^2$ and $\\sqrt{x^2 + y^2}$

Block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\frac{d}{dx}\\left(\\int_{a}^{x} f(t)\\,dt\\right) = f(x)
$$

---

## Diagrams (Mermaid)

\`\`\`mermaid
flowchart LR
    A([Start]) --> B{Is it markdown?}
    B -- Yes --> C[M4rkdown :tada:]
    B -- No  --> D[Plain text]
    C --> E([Ship it])
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant E as Editor
    participant W as Worker
    U->>E: Type markdown
    E->>W: parseAsync(source)
    W-->>E: HTML string
    E-->>U: Live preview
\`\`\`

---

## Callout Blocks

::: note
Use \`:::note\`, \`:::tip\`, \`:::warning\`, \`:::danger\`, or \`:::info\`.
:::

::: warning Heads up
Content inside callouts supports **full markdown** — including \`code\` and lists.
:::

::: danger Breaking change
Always back up your work before destructive operations.
:::

::: tip Pro tips
- Press **Ctrl+H** for Find & Replace
- Click **◎** in the toolbar for Focus mode
- Click **↕** for Typewriter mode (cursor stays centered)
- Click **≡** to toggle the Outline sidebar
:::

---

## Code Blocks

\`\`\`typescript
// TypeScript with syntax highlighting
interface Doc { id: string; title: string; content: string; }

function renderMarkdown(src: string): string {
  return md.render(src);
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    a, b = 0, 1
    return [a := a + b and b, b := a + b][0] or []
\`\`\`

---

## Tables

| Feature           | Status | Notes                      |
|-------------------|--------|----------------------------|
| Math (KaTeX)      | ✅     | \`$inline$\` and \`$$block$$\` |
| Mermaid diagrams  | ✅     | Lazy-loaded                |
| Callout blocks    | ✅     | \`:::note\`, \`:::warning\`    |
| Emoji             | ✅     | \`:tada:\` :tada:              |
| Footnotes         | ✅     | \`[^1]\` syntax               |
| Table of contents | ✅     | Use \`\${toc}\`                |
| Focus mode        | ✅     | Toolbar ◎                  |
| Typewriter mode   | ✅     | Toolbar ↕                  |
| Outline sidebar   | ✅     | Toolbar ≡                  |
| Find & Replace    | ✅     | Ctrl+H                     |

---

## Task List

- [x] CodeMirror 6 editor with syntax highlighting
- [x] Full CommonMark + GFM rendering
- [x] Math / LaTeX via KaTeX
- [x] Mermaid diagrams (lazy-loaded)
- [x] Focus & Typewriter modes
- [x] YAML frontmatter panel
- [x] Outline sidebar
- [x] Multi-document with auto-save
- [x] PWA — install & use offline
- [ ] Real-time collaboration
- [ ] WYSIWYG inline mode

---

## Blockquote

> "The best tool is the one you actually use every day."
> — Unknown

[View source on GitHub](https://github.com/zhenxiao-yu/m4rkdown-editor) · [Report an issue](https://github.com/zhenxiao-yu/m4rkdown-editor/issues)
`;
