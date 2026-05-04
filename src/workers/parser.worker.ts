// @ts-nocheck
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(taskLists, { enabled: true, label: true });

const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = (token.info || '').trim().split(/\s+/)[0];
    const base = defaultFence
        ? defaultFence(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    return lang ? base.replace('<pre>', `<pre data-lang="${lang}">`) : base;
};

const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens: unknown[], idx: number, options: unknown, _env: unknown, self: { renderToken: (t: unknown[], i: number, o: unknown) => string }) =>
    self.renderToken(tokens, idx, options)
);
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    (tokens[idx] as { attrSet: (k: string, v: string) => void }).attrSet('target', '_blank');
    (tokens[idx] as { attrSet: (k: string, v: string) => void }).attrSet('rel', 'noopener noreferrer');
    return defaultLinkOpen(tokens, idx, options, env, self);
};

self.onmessage = (e: MessageEvent<{ id: string; source: string }>) => {
    try {
        const html = md.render(e.data.source);
        self.postMessage({ id: e.data.id, html, error: null });
    } catch (err) {
        self.postMessage({ id: e.data.id, html: '', error: String(err) });
    }
};
