import parse from "./parse";
import render from "./render";
import { Block } from "./tokenizer";

/**
 * A class to convert Markdown text into an HTML representation.
 */
class Markdown {
    private input: Block; // Internal representation of the Markdown text
    private output: string; // Rendered HTML output

    /**
     * Initializes the Markdown processor.
     * @param {string} text - The Markdown text to process.
     */
    constructor(text: string) {
        this.process(text);
    }

    /**
     * Processes the Markdown input: tokenization, parsing, and rendering.
     * @param {string} text - The Markdown text to process.
     */
    private process(text: string): void {
        try {
            this.tokenize(text);
            this.parse();
            this.generateHtml();
        } catch (error) {
            console.error("Markdown processing error:", error);
            this.output = "<p>Error processing Markdown input.</p>";
        }
    }

    /**
     * Tokenizes the input Markdown text into a block structure.
     * @param {string} text - The Markdown text to tokenize.
     */
    private tokenize(text: string): void {
        this.input = new Block(text);
    }

    /**
     * Parses the tokenized Markdown block.
     */
    private parse(): void {
        parse(this.input);
    }

    /**
     * Renders the parsed tokens into HTML.
     */
    private generateHtml(): void {
        this.output = render(this.input);
    }

    /**
     * Returns the syntax tree (tokens) of the processed Markdown input.
     * @returns {string} - A JSON string representation of the tokens.
     */
    getSyntaxTree(): string {
        return JSON.stringify(this.input.tokens, null, 2);
    }

    /**
     * Returns the rendered HTML output.
     * @returns {string} - The HTML string.
     */
    getHtml(): string {
        return this.output;
    }
}

export default Markdown;
