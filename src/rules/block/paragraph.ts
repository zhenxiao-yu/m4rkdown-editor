import { Block } from "@/core/tokenizer";

/**
 * Parses a paragraph from the current position in the `Block` and generates
 * corresponding opening and closing tokens for the paragraph.
 *
 * @param {Block} state - The current parsing state containing the source text and tokens.
 */
function parseParagraph(state: Block) {
  // If the current position is at or beyond the maximum, there is nothing to parse
  if (state.pos >= state.posMax) return;

  // Push the opening paragraph token
  state.pushToken({
    type: "paragraph_open", // Token type indicating the start of a paragraph
    tag: "p", // HTML tag for the paragraph
    nesting: 1, // Indicates an opening token
    content: "", // No direct content for the opening token
    children: [] // No children at this point
  });

  // Process the text within the paragraph and generate inline tokens
  state.pushSegment();

  // Push the closing paragraph token
  state.pushToken({
    type: "paragraph_close", // Token type indicating the end of a paragraph
    tag: "p", // HTML tag for the paragraph
    nesting: -1, // Indicates a closing token
    content: "", // No direct content for the closing token
    children: [] // No children for closing tags
  });
}

export default parseParagraph;
