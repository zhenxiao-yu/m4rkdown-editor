import { Token } from "@/types/token";
import { Block } from "./tokenizer";

/**
 * Renders the HTML from a block's tokens.
 *
 * @param {Block} state - The block containing tokens to render.
 * @returns {string} - The generated HTML string.
 */
function render(state: Block): string {
    const tokens = state.tokens;
    let html = "";

    /**
     * Renders a single token into HTML.
     *
     * @param {Token} token - The token to render.
     */
    const renderToken = (token: Token): void => {
        switch (token.nesting) {
            case 1: // Opening tag
                html += `<${token.tag}${formatAttrs(token.attrs)}>`;
                break;

            case 0: // Text or self-closing tag
                if (token.children && token.children.length > 0) {
                    token.children.forEach(child => renderToken(child)); // Render nested children
                } else {
                    html += token.content; // Append plain text content
                }
                break;

            case -1: // Closing tag
                html += `</${token.tag}>`;
                break;

            default:
                console.warn(`Unknown nesting type: ${token.nesting}`);
        }
    };

    // Render each token in the token list
    tokens.forEach(token => renderToken(token));

    return html;
}

/**
 * Formats the attributes of a token into an HTML attribute string.
 *
 * @param {string[][] | undefined} attrs - The attributes to format.
 * @returns {string} - The formatted attribute string.
 */
const formatAttrs = (attrs?: string[][]): string => {
    if (!attrs) return '';
    return attrs
        .map(attr => (attr.length === 2 ? ` ${attr[0]}="${attr[1]}"` : ''))
        .join('');
};

export default render;
