import MarkdownIt from 'markdown-it';
// @ts-ignore
import taskLists from 'markdown-it-task-lists';
// @ts-ignore
import { full as emoji } from 'markdown-it-emoji';
// @ts-ignore
import footnote from 'markdown-it-footnote';
// @ts-ignore
import container from 'markdown-it-container';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-toc-done-right';
// @ts-ignore
import texmath from 'markdown-it-texmath';
import katex from 'katex';

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
});

// ── Plugins ──────────────────────────────────────────────────────────

md.use(taskLists, { enabled: true, label: true });
md.use(emoji);
md.use(footnote);
md.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false, errorColor: '#ff4444' },
});

// Heading anchors (must come before TOC)
md.use(anchor, {
    slugify: (s: string) =>
        s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
    permalink: anchor.permalink.headerLink(),
});

// TOC — use ${toc} in markdown to insert
md.use(toc, {
    placeholder: '(\\$\\{toc\\}|\\[\\[toc\\]\\])',
    slugify: (s: string) =>
        s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
    listType: 'ul',
});

// Callout containers: ::: note, ::: warning, ::: tip, ::: danger, ::: info
const CALLOUT_TYPES = ['note', 'tip', 'warning', 'danger', 'info'] as const;
CALLOUT_TYPES.forEach((type) => {
    md.use(container, type, {
        render(tokens: { nesting: number; info: string }[], idx: number) {
            if (tokens[idx].nesting === 1) {
                const raw = tokens[idx].info.trim().slice(type.length).trim();
                const title = raw || (type.charAt(0).toUpperCase() + type.slice(1));
                return `<div class="callout callout-${type}"><div class="callout-title">${md.utils.escapeHtml(title)}</div><div class="callout-body">\n`;
            }
            return '</div></div>\n';
        },
    });
});

// ── Fence renderer (mermaid + language label) ─────────────────────────

const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = (token.info || '').trim().split(/\s+/)[0];

    if (lang === 'mermaid') {
        const encoded = encodeURIComponent(token.content);
        return `<div class="mermaid-pending" data-src="${encoded}"></div>\n`;
    }

    const base = defaultFence
        ? defaultFence(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    return lang ? base.replace('<pre>', `<pre data-lang="${lang}">`) : base;
};

// ── Link renderer (open in new tab) ───────────────────────────────────

import type { RenderRule } from 'markdown-it/lib/renderer.mjs';

const fallbackLinkOpen: RenderRule = (tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options);

const defaultLinkOpen: RenderRule = md.renderer.rules.link_open ?? fallbackLinkOpen;

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
    return defaultLinkOpen(tokens, idx, options, env, self);
};

export default md;
