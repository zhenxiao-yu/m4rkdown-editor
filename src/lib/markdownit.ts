import MarkdownIt from 'markdown-it';
// @ts-ignore — no types for markdown-it-task-lists
import taskLists from 'markdown-it-task-lists';

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
});

md.use(taskLists, { enabled: true, label: true });

// Fence renderer — adds data-lang attribute for language label
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = (token.info || '').trim().split(/\s+/)[0];
    const base = defaultFence
        ? defaultFence(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    if (lang) {
        return base.replace('<pre>', `<pre data-lang="${lang}">`);
    }
    return base;
};

// Open links in new tab
const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options)
);
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
    return defaultLinkOpen(tokens, idx, options, env, self);
};

export default md;
