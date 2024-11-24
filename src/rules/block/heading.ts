import { Block } from "@/core/tokenizer";
import { HASH, SPACE } from "../common/delimiters";

/**
 * Parses a Markdown heading (e.g., `# Heading`) from the current position in the source text.
 *
 * @param {Block} state - The current parsing state containing the source text and tokens.
 */
function parseHeading(state: Block) {
  // Ensure the current position starts with a hash (`#`)
  if (state.src.charCodeAt(state.pos) !== HASH) return;

  // Calculate the heading level based on the number of consecutive hashes
  let headingLevel = 1; // Start with level 1 for a single `#`
  state.pos++; // Move past the first hash
  while (
      state.pos < state.posMax && // Ensure we don't go out of bounds
      state.src.charCodeAt(state.pos) === HASH // Count additional hashes
      ) {
    headingLevel++;
    state.pos++;
  }

  // Headings beyond level 6 are invalid in Markdown, so exit
  if (headingLevel > 6) return;

  // Push the opening heading token (e.g., `<h1>` to `<h6>`)
  state.pushToken({
    type: "heading_open", // Token type for opening a heading
    tag: "h" + headingLevel, // Determine the heading tag (e.g., `h1`, `h2`, ...)
    nesting: 1, // Indicates an opening token
    content: "", // No direct content for the opening tag
    children: [] // No children at this point
  });

  // Skip over any spaces after the hashes
  while (
      state.pos < state.posMax && // Ensure we don't go out of bounds
      state.src.charCodeAt(state.pos) === SPACE // Skip spaces
      ) {
    state.pos++;
  }

  // Parse the content of the heading
  state.pushSegment();

  // Push the closing heading token (e.g., `</h1>` to `</h6>`)
  state.pushToken({
    type: "heading_close", // Token type for closing a heading
    tag: "h" + headingLevel, // Match the heading tag (e.g., `h1`, `h2`, ...)
    nesting: -1, // Indicates a closing token
    content: "", // No direct content for the closing tag
    children: [] // No children for the closing tag
  });
}

export default parseHeading;
