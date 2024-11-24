import { NEWLINE, SPACE, hasDelimiter } from "@/rules/common/delimiters";
import { parseInlineText } from "@/rules/inline";
import { Token } from "@/types/token";

export class Block {
    src: string; // Source text input
    posMax: number; // Maximum position in the source text
    pos: number; // Current parsing position
    buffer: Token[]; // Temporary buffer for nested tokens
    tokens: Token[]; // Final list of parsed tokens

    constructor(src: string) {
        this.src = src; // Initialize source text
        this.posMax = src.length; // Calculate the maximum position in the source
        this.pos = 0; // Start parsing from position 0
        this.buffer = []; // Initialize an empty buffer
        this.tokens = []; // Initialize an empty token list
    }

    /**
     * Pushes a token into the tokens list or its appropriate parent in the buffer.
     * Handles nesting for open and close tokens.
     * @param {Token} token - The token to be added.
     */
    pushToken(token: Token) {
        // Ignore standalone spaces and empty content
        if (token.content === String.fromCharCode(SPACE) || (!token.tag && token.content.length === 0)) return;

        // Add token as a child if the parent is an "inline_block"
        const parentToken = this.buffer[this.buffer.length - 1];
        if (parentToken?.type === "inline_block") {
            parentToken.children = parentToken.children || [];
            parentToken.children.push(token);
        } else {
            // Otherwise, add token to the main tokens list
            this.tokens.push(token);
        }

        // Manage nesting based on the token's nesting value
        if (token.nesting > 0) {
            this.buffer.push(token); // Opening token
        } else if (token.nesting < 0) {
            this.buffer.pop(); // Closing token
        }
    }

    /**
     * This function is reserved for pushing parent tokens.
     * Currently not implemented but left for future use.
     */
    pushParentToken(token: Token) {
        // Placeholder for parent token logic
    }

    /**
     * Splits the source text into segments based on delimiters and newlines,
     * then pushes each segment as an "inline_block" token.
     */
    pushSegment() {
        const segments: string[] = [];
        let segmentStart = this.pos;

        while (this.pos < this.posMax) {
            // If a newline is encountered, split the segment and continue
            if (this.src.charCodeAt(this.pos) === NEWLINE) {
                segments.push(this.src.slice(segmentStart, this.pos));
                segmentStart = this.pos + 1;
                this.pos++;
                break;
            }

            // Split the segment if a delimiter is followed by a space
            // ⚠️ Note: This splitting logic may not be fully accurate and needs refinement.
            if (
                hasDelimiter(this.src.slice(this.pos, this.pos + 1)) &&
                this.src.charCodeAt(this.pos + 1) === SPACE
            ) {
                segments.push(this.src.slice(segmentStart, this.pos + 1));
                segmentStart = this.pos + 1;
            }

            this.pos++;
        }

        // Add the remaining segment
        segments.push(this.src.slice(segmentStart, this.pos));

        // Convert each segment into an "inline_block" token
        for (const segment of segments) {
            this.pushToken({
                type: "inline_block",
                tag: "",
                nesting: 0,
                content: segment,
                children: []
            });
        }
    }
}

export class InlineBlock extends Block {
    delimiters: { char: number; pos: number }[]; // List of all detected delimiters
    cache: string; // Cache for text between open and close tags

    constructor(src: string) {
        super(src); // Initialize the parent class with source text
        this.delimiters = []; // Initialize delimiters list
        this.cache = ''; // Initialize the cache
        this.scanDelimiters(); // Scan for delimiters in the source
    }

    /**
     * Scans the source text for delimiters and records their positions.
     */
    private scanDelimiters() {
        let i = this.pos;
        while (i < this.posMax) {
            const charCode = this.src.charCodeAt(i);
            if (hasDelimiter(this.src.charAt(i))) {
                this.delimiters.push({ char: charCode, pos: i });
            }
            i++;
        }
    }

    /**
     * Pushes a token directly into the tokens list.
     * Ignores standalone spaces.
     * @param {Token} token - The token to push.
     */
    pushToken(token: Token) {
        if (token.content === String.fromCharCode(SPACE)) return; // Ignore spaces
        this.tokens.push(token);
    }

    /**
     * Pushes plain text from the specified range.
     * Optionally processes the text for inline parsing if `isEnd` is true.
     * @param {number} start - The start position of the text.
     * @param {number} end - The end position of the text.
     * @param {boolean} [isEnd] - Indicates if this is the final segment to process.
     */
    pushText(start: number, end: number, isEnd?: boolean) {
        if (start < end) {
            const text = this.src.slice(start, end);

            // If the text has no delimiters, push it as a plain text token
            if (!hasDelimiter(text)) {
                this.tokens.push({
                    type: "text",
                    tag: "",
                    nesting: 0,
                    content: text,
                    children: []
                });
                return;
            }

            // Cache the text for inline parsing
            this.cache += `${String.fromCharCode(SPACE)}${text}`;
        }

        if (isEnd) {
            // Parse the cached text into tokens
            let processToken = parseInlineText(new InlineBlock(this.cache.trim()));

            // Remove tokens with only delimiters
            processToken = processToken.filter(token => !hasDelimiter(token.content));

            // Split tokens into opening and closing sections
            const middleIndex = Math.floor(processToken.length / 2);
            const openTokens = processToken.slice(0, middleIndex);
            const closeTokens = processToken.slice(middleIndex);

            // Insert opening tokens and append closing tokens
            this.tokens.splice(this.delimiters[0]?.pos > 0 ? 1 : 0, 0, ...openTokens);
            this.tokens.push(...closeTokens);

            // Clear the cache
            this.cache = '';
        }
    }
}
