import { InlineBlock } from "@/core/tokenizer";
import { parseInlineText } from ".";
import { STAR, UNDERSCORE } from "../common/delimiters";

/**
 * Parses emphasis (italic or bold) tokens in the inline text.
 * Supports both `*` and `_` delimiters for emphasis.
 *
 * @param {InlineBlock} state - The inline parsing state containing the source text and delimiters.
 * @returns {boolean} - True if emphasis tokens were successfully parsed, otherwise false.
 */
function parseEmphasis(state: InlineBlock): boolean {
    const text = state.src;
    const emMarks = state.delimiters.filter(d => d.char === STAR || d.char === UNDERSCORE);

    // Early exit if there is no text or insufficient delimiters for emphasis
    if (!text.length || emMarks.length < 2) return false;

    let lastPos = 0;
    let i = 0;

    // Iterate through delimiters to find matching pairs
    while (i < emMarks.length - 1) {
        const startMark = emMarks[i];
        const endMark = emMarks[i + 1];
        const nextStartMark = emMarks[i + 2];

        // Skip consecutive delimiters to avoid invalid parsing
        if (endMark.pos - startMark.pos === 1) {
            i++;
            if (emMarks.length === 2) return false; // Prevent infinite loop in recursive cases
            continue;
        }

        // Determine if this is strong emphasis (bold)
        const isStrong = nextStartMark?.pos - endMark?.pos === 1;

        // Select the appropriate HTML tag
        const tag = isStrong ? "strong" : "em";

        // Extract content between delimiters
        const emContent = text.slice(startMark.pos + 1, endMark.pos);

        // Push the plain text before the current emphasis block
        state.pushText(state.pos + lastPos, startMark.pos);

        // Open emphasis/bold tag
        state.pushToken({
            type: `${tag}_open`,
            tag,
            nesting: 1,
            content: "",
            children: []
        });

        // Parse and push the inner content as text or inline tokens
        state.pushToken({
            type: "text",
            tag: "",
            nesting: 0,
            content: emContent,
            children: parseInlineText(new InlineBlock(emContent))
        });

        // Close emphasis/bold tag
        state.pushToken({
            type: `${tag}_close`,
            tag,
            nesting: -1,
            content: "",
            children: []
        });

        // Update the position to the end of the processed block
        lastPos = endMark.pos + 1;
        if (isStrong) lastPos++; // Adjust for strong emphasis

        i += isStrong ? 3 : 2; // Move the iterator accordingly
    }

    // Push remaining text after the last emphasis block
    state.pushText(lastPos, text.length, true);

    // Update the state position
    state.pos = text.length;

    return true;
}

export default parseEmphasis;
