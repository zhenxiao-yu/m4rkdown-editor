import { InlineBlock } from "@/core/tokenizer";

/**
 * Parses plain text before the first delimiter and pushes it as a token.
 *
 * This function extracts and processes the portion of the input text
 * that appears before the first detected delimiter.
 *
 * @param {InlineBlock} state - The inline parsing state containing the source text and delimiters.
 */
function parseText(state: InlineBlock): void {
    // Get the position of the first delimiter, if available
    const firstPos = state.delimiters[0]?.pos;

    // If there are no delimiters or the first position is undefined, do nothing
    if (typeof firstPos === "undefined" || firstPos <= 0) return;

    // Extract and push the plain text token
    state.pushToken({
        type: "text",
        tag: "",
        nesting: 0,
        content: state.src.slice(0, firstPos), // Get text before the first delimiter
        children: []
    });

    // Update the position in the parsing state
    state.pos += firstPos;
}

export default parseText;
