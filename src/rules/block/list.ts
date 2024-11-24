import { Block } from "@/core/tokenizer";
import { DASH, DOT, PLUS, SPACE } from "../common/delimiters";

/**
 * Verifies whether the current position in the source text indicates a valid list item.
 * Supports unordered lists (dash or plus followed by a space) and ordered lists (number + dot + space).
 *
 * @param {Block} state - The current parsing state.
 * @returns {Object} - An object indicating validity and list type (`ul` or `ol`).
 */
const verifyList = (state: Block) => {
    const currentChar = state.src.charCodeAt(state.pos);
    const nextChar = state.src.charCodeAt(state.pos + 1);
    const thirdChar = state.src.charCodeAt(state.pos + 2);

    // Check for unordered list (`- ` or `+ `)
    if ((currentChar === DASH || currentChar === PLUS) && nextChar === SPACE) {
        return { isValid: true, tag: 'ul' }; // Valid unordered list
    }

    // Check for ordered list (e.g., `1. `)
    if (currentChar > 0x30 && currentChar < 0x39 && nextChar === DOT && thirdChar === SPACE) {
        return { isValid: true, tag: 'ol' }; // Valid ordered list
    }

    return { isValid: false, tag: '' }; // Not a valid list
};

/**
 * Parses a list structure (either unordered or ordered) and its items.
 * Handles nested lists by recursively calling itself for deeper levels of indentation.
 *
 * @param {Block} state - The current parsing state.
 * @param {number} [indent=0] - The current indentation level for nested lists.
 */
function parseList(state: Block, indent: number = 0) {
    const { isValid, tag } = verifyList(state);
    if (!isValid) return; // Exit if not a valid list

    // Open the list token
    state.pushToken({
        type: "list_open",
        tag: tag, // 'ul' or 'ol'
        nesting: 1,
        content: "",
        children: []
    });

    // Push a placeholder inline block token (optional or customizable)
    state.tokens.push({
        type: "inline_block",
        tag: " ",
        nesting: 0,
        content: " ",
        children: []
    });

    // Parse the first list item
    parseListItem(state, indent);

    // Close the list token
    state.pushToken({
        type: "list_close",
        tag: tag,
        nesting: -1,
        content: "",
        children: []
    });
}

/**
 * Parses an individual list item and handles nested lists or items.
 *
 * @param {Block} state - The current parsing state.
 * @param {number} indent - The current indentation level.
 */
function parseListItem(state: Block, indent: number) {
    const prevList = verifyList(state);
    if (!prevList.isValid) return; // Exit if not a valid list item

    // Move the position past the list marker (`- `, `+ `, or `1. `)
    state.pos += prevList.tag === 'ul' ? 2 : 3;

    // Open the list item token
    state.pushToken({
        type: "list_item_open",
        tag: "li",
        nesting: 1,
        content: "",
        children: []
    });

    // Parse the content of the list item
    state.pushSegment();

    // Close the list item token
    state.pushToken({
        type: "list_item_close",
        tag: "li",
        nesting: -1,
        content: "",
        children: []
    });

    // Process potential nested list items
    while (state.pos < state.posMax) {
        let nestedSpaces = 0;

        // Count leading spaces to determine nesting level
        while (state.src.charCodeAt(state.pos) === SPACE) {
            state.pos++;
            nestedSpaces++;
        }

        const currList = verifyList(state);

        // Exit if no nesting detected
        if (nestedSpaces === 0) {
            if (currList.isValid) state.pos--; // Adjust position for next parse
            return;
        }

        // Handle nested or same-level lists
        if (nestedSpaces > indent || currList.tag !== prevList.tag) {
            // Nested list or tag change requires a new list parsing
            parseList(state, nestedSpaces);
        } else if (nestedSpaces === indent) {
            // Same-level list item
            parseListItem(state, nestedSpaces);
        }
    }
}

export default parseList;
