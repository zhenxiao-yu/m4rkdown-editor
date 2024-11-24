// Define ASCII codes for commonly used delimiters and characters
export const SPACE = 0x20; // Space character (' ')
export const NEWLINE = 0x0a; // Newline character ('\n')

export const HASH = 0x23; // Hash ('#') used for headings
export const DASH = 0x2d; // Dash ('-') used for lists
export const PLUS = 0x2b; // Plus ('+') used for lists
export const DOT = 0x2e; // Dot ('.') used for ordered lists

export const STAR = 0x2a; // Asterisk ('*') used for emphasis/bold
export const UNDERSCORE = 0x5f; // Underscore ('_') used for emphasis/bold
export const LEFT_BRACKET = 0x5b; // Left square bracket ('[') used for links
export const RIGHT_BRACKET = 0x5d; // Right square bracket (']') used for links
export const LEFT_PAREN = 0x28; // Left parenthesis ('(') used for links
export const RIGHT_PAREN = 0x29; // Right parenthesis (')') used for links

/**
 * Checks if the given string contains any of the predefined delimiters.
 *
 * @param {string} src - The input string to check for delimiters.
 * @returns {boolean} - True if the string contains at least one delimiter, otherwise false.
 */
export const hasDelimiter = (src: string): boolean => {
    // Define an array of delimiter ASCII codes
    const delimiterCodes = [
        STAR, UNDERSCORE, // Used for emphasis or bold text
        LEFT_BRACKET, RIGHT_BRACKET, // Used for links
        LEFT_PAREN, RIGHT_PAREN // Used for links
    ];

    // Convert ASCII codes to their corresponding characters
    const delimiters = delimiterCodes.map(code => String.fromCharCode(code));

    // Check if the input string contains any of the delimiters
    return delimiters.some(d => src.includes(d));
};
