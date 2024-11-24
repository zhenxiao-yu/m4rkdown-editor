# M4rkdown (MD Parser)

A lightweight and modular Markdown parser built with JavaScript/TypeScript, designed to tokenize and render Markdown syntax into structured tokens or HTML. This parser is flexible and extensible, enabling support for additional Markdown features with minimal effort.

------

## Features

- **Heading Parsing**: Supports Markdown headings (`#`, `##`, ..., `######`).

- **List Parsing**: Handles unordered (`-`, `+`) and ordered (`1.`, `2.`) lists, including nested lists.

- Inline Parsing

  :

    - Emphasis (`*italic*`, `_italic_`)
    - Bold (`**bold**`, `__bold__`)
    - Links (`[text](url)`)

- **Token-Based Design**: Converts Markdown input into tokens for further processing or rendering.

- **Extensibility**: Easily add custom rules for additional Markdown features.

------

## Table of Contents

1. [Installation](https://chatgpt.com/c/67428cc5-6090-8013-bb5b-3c7a84d84061#installation)
2. [Usage](https://chatgpt.com/c/67428cc5-6090-8013-bb5b-3c7a84d84061#usage)
3. [Code Overview](https://chatgpt.com/c/67428cc5-6090-8013-bb5b-3c7a84d84061#code-overview)
4. [Examples](https://chatgpt.com/c/67428cc5-6090-8013-bb5b-3c7a84d84061#examples)
5. [Contributing](https://chatgpt.com/c/67428cc5-6090-8013-bb5b-3c7a84d84061#contributing)
6. [License](https://chatgpt.com/c/67428cc5-6090-8013-bb5b-3c7a84d84061#license)

------

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/markdown-parser.git

# Navigate into the project directory
cd markdown-parser

# Install dependencies
npm install
```

------

## Usage

To use the parser in your project:

### Input Markdown String

```typescript
import Markdown from "@/core/markdown";

const markdown = new Markdown(`# Hello World\nThis is a *Markdown* parser.`);

// Get syntax tree (tokens)
console.log(markdown.getSyntaxTree());

// Get rendered HTML
console.log(markdown.getHtml());
```

### Output Example

**Input Markdown:**

```markdown
# Hello World
This is a *Markdown* parser.
```

**Generated Tokens:**

```json
[
  {
    "type": "heading_open",
    "tag": "h1",
    "nesting": 1,
    "content": "",
    "children": []
  },
  {
    "type": "text",
    "tag": "",
    "nesting": 0,
    "content": "Hello World",
    "children": []
  },
  {
    "type": "heading_close",
    "tag": "h1",
    "nesting": -1,
    "content": "",
    "children": []
  },
  {
    "type": "text",
    "tag": "",
    "nesting": 0,
    "content": "This is a ",
    "children": []
  },
  {
    "type": "em_open",
    "tag": "em",
    "nesting": 1,
    "content": "",
    "children": []
  },
  {
    "type": "text",
    "tag": "",
    "nesting": 0,
    "content": "Markdown",
    "children": []
  },
  {
    "type": "em_close",
    "tag": "em",
    "nesting": -1,
    "content": "",
    "children": []
  },
  {
    "type": "text",
    "tag": "",
    "nesting": 0,
    "content": " parser.",
    "children": []
  }
]
```

**Generated HTML:**

```html
<h1>Hello World</h1>
<p>This is a <em>Markdown</em> parser.</p>
```

------

## Code Overview

### Core Components

1. **Tokenizer**:
    - `Block` and `InlineBlock` classes handle parsing text into tokens.
    - Converts Markdown into a structured representation.
2. **Parsing Rules**:
    - `parseHeading`: Parses Markdown headings (`# Heading`).
    - `parseList`: Parses ordered/unordered lists and handles nesting.
    - `parseInlineBlock`: Handles inline elements like emphasis, links, and plain text.
3. **Rendering**:
    - Tokens are rendered into HTML using the `render` function.

------

## Examples

### Heading Parsing

Input:

```markdown
## This is a heading
```

Output:

```html
<h2>This is a heading</h2>
```

### List Parsing

Input:

```markdown
- Item 1
  - Nested Item 1.1
- Item 2
```

Output:

```html
<ul>
  <li>Item 1
    <ul>
      <li>Nested Item 1.1</li>
    </ul>
  </li>
  <li>Item 2</li>
</ul>
```

------

## Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a new branch (`feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please ensure your code adheres to the existing style and includes relevant tests.



