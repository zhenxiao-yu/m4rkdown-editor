import { InlineBlock } from "@/core/tokenizer";
import { parseInlineText } from ".";
import { LEFT_BRACKET, LEFT_PAREN, RIGHT_BRACKET, RIGHT_PAREN } from "../common/delimiters";

/**
 * Parses inline links in the text and generates corresponding tokens.
 *
 * Supports the Markdown syntax `[link text](URL)` for inline links.
 *
 * @param {InlineBlock} state - The inline parsing state containing the source text and delimiters.
 * @returns {boolean} - True if at least one link was successfully parsed, otherwise false.
 */
function parseLink(state: InlineBlock): boolean {
    const text = state.src;
    const linkMarks = state.delimiters.filter(d => d.char === LEFT_BRACKET);

    // Early exit if there is no text or no potential link delimiters
    if (!text.length || linkMarks.length === 0) return false;

    let lastPos = 0;
    let parsed = false;

    for (const delimiter of linkMarks) {
        // Find matching delimiters for the link text and URL
        const linkTextEnd = state.delimiters.find(d => d.char === RIGHT_BRACKET && d.pos > delimiter.pos);
        const linkUrlStart = linkTextEnd
            ? state.delimiters.find(d => d.char === LEFT_PAREN && d.pos > linkTextEnd.pos)
            : null;
        const linkUrlEnd = linkUrlStart
            ? state.delimiters.find(d => d.char === RIGHT_PAREN && d.pos > linkUrlStart.pos)
            : null;

        // Skip if any of the required delimiters are missing
        if (!linkTextEnd || !linkUrlStart || !linkUrlEnd) continue;

        // Extract link content and URL
        const linkContent = text.slice(delimiter.pos + 1, linkTextEnd.pos).trim();
        const linkUrl = text.slice(linkUrlStart.pos + 1, linkUrlEnd.pos).trim();

        // Push any plain text before the link
        state.pushText(state.pos + lastPos, delimiter.pos);

        // Push tokens for the link
        state.pushToken({
            type: "link_open",
            tag: "a",
            nesting: 1,
            content: "",
            attrs: [
                ["href", linkUrl],
                ["target", "_blank"]
            ],
            children: []
        });

        state.pushToken({
            type: "text",
            tag: "",
            nesting: 0,
            content: linkContent,
            children: parseInlineText(new InlineBlock(linkContent))
        });

        state.pushToken({
            type: "link_close",
            tag: "a",
            nesting: -1,
            content: "",
            children: []
        });

        // Update the position and mark as parsed
        lastPos = linkUrlEnd.pos + 1;
        parsed = true;
    }

    // Push remaining plain text after the last link
    state.pushText(lastPos, text.length, true);

    // Update the state position
    state.pos = text.length;

    return parsed;
}

export default parseLink;
