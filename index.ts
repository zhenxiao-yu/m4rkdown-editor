import Markdown from '@/core';
import beautify from 'js-beautify';

/**
 * Load the default Markdown content from a file.
 * @returns {Promise<string>} The default markdown content or an empty string on error.
 */
async function loadDefaultMd(): Promise<string> {
    try {
        const response = await fetch('/example.md');
        if (!response.ok) throw new Error(`Failed to fetch /example.md: ${response.statusText}`);
        return await response.text();
    } catch (error) {
        console.error('Error loading default markdown:', error);
        return '';
    }
}

/**
 * Initialize the application, set up event listeners, and load default markdown.
 */
async function initialize(): Promise<void> {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
    const htmlContentBox = document.getElementById('html-content-box');
    const sourceContentBox = document.getElementById('source-content-box');
    const tokenContentBox = document.getElementById('token-content-box');

    if (!textarea || !htmlContentBox || !sourceContentBox || !tokenContentBox) {
        console.error('Required elements not found in DOM.');
        return;
    }

    // Load and display default Markdown content
    textarea.value = await loadDefaultMd();

    // Update output on Markdown input change
    const updateOutput = () => {
        try {
            const markdownInput = textarea.value;
            const { tokens, html } = buildParser(markdownInput);

            htmlContentBox.innerHTML = html;
            sourceContentBox.textContent = beautify.html(html, { indent_size: 2 });
            tokenContentBox.textContent = tokens
        } catch (error) {
            console.error('Error parsing Markdown:', error);
            htmlContentBox.innerHTML = '<p style="color: red;">Error rendering Markdown.</p>';
            sourceContentBox.textContent = '';
            tokenContentBox.textContent = '';
        }
    };

    // Initial rendering
    updateOutput();

    // Update output dynamically on input
    textarea.addEventListener('input', updateOutput);
}

/**
 * Build the Markdown parser and process the input.
 * @param {string} input - The Markdown input to parse.
 * @returns {{ tokens: any, html: string }} - Parsed tokens and HTML output.
 */
function buildParser(input: string): { tokens: any; html: string } {
    try {
        const markdown = new Markdown(input);
        const tokens = markdown.getSyntaxTree();
        const html = markdown.getHtml();
        return { tokens, html };
    } catch (error) {
        console.error('Error building parser:', error);
        throw error; // Rethrow for external handling
    }
}

// Initialize the application
initialize().catch((error) => {
    console.error('Error initializing application:', error);
});
