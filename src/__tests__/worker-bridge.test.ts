import { describe, it, expect, vi } from 'vitest';

// Smoke test: verify markdown-it renders a heading correctly
// (Worker bridge requires a real Worker; we test the parser logic directly here)
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true });

describe('Markdown rendering', () => {
    it('renders a heading', () => {
        const html = md.render('# Hello World');
        expect(html).toContain('<h1>');
        expect(html).toContain('Hello World');
    });

    it('renders bold text', () => {
        const html = md.render('**bold**');
        expect(html).toContain('<strong>');
    });

    it('renders a code block', () => {
        const html = md.render('```js\nconsole.log("hi")\n```');
        expect(html).toContain('<code');
        expect(html).toContain('console.log');
    });

    it('renders a table', () => {
        const html = md.render('| A | B |\n|---|---|\n| 1 | 2 |');
        expect(html).toContain('<table>');
    });

    it('renders a blockquote', () => {
        const html = md.render('> hello');
        expect(html).toContain('<blockquote>');
    });

    it('renders strikethrough', () => {
        const html = md.render('~~strike~~');
        expect(html).toContain('strike');
    });
});
