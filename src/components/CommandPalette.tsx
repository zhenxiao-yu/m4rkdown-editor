import { useEffect, useRef, useState } from 'preact/hooks';
import autoAnimate from '@formkit/auto-animate';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { paletteOpen, closePalette, openTemplateModal } from '@/store/commandPalette';
import { toggleFocusMode, toggleTypewriterMode, toggleOutline, toggleZenMode, toggleVimMode } from '@/store/settings';
import { toggleTheme } from '@/store/theme';
import { createDoc, activeDoc, docList, setActiveDoc } from '@/store/documents';
import { markdownSource, parsedHtml } from '@/store/editor';
import { exportMarkdown, exportHtml } from '@/lib/export';
import { buildShareUrl } from '@/lib/share';
import { showToast } from '@/store/toast';
import { FileText } from 'lucide-react';

interface PaletteAction {
    id: string;
    label: string;
    category: string;
    keywords: string[];
    shortcut?: string;
    run: () => void;
}

function getActions(): PaletteAction[] {
    return [
        {
            id: 'new-doc',
            label: 'New Document',
            category: 'File',
            keywords: ['new', 'create', 'document', 'file'],
            shortcut: 'Ctrl+N',
            run: () => { createDoc(); closePalette(); },
        },
        {
            id: 'export-md',
            label: 'Export as Markdown',
            category: 'Export',
            keywords: ['export', 'download', 'markdown', 'md', 'save'],
            run: () => {
                const title = activeDoc.value?.title ?? 'document';
                exportMarkdown(markdownSource.value, title);
                closePalette();
            },
        },
        {
            id: 'export-html',
            label: 'Export as HTML',
            category: 'Export',
            keywords: ['export', 'download', 'html', 'save'],
            run: () => {
                const title = activeDoc.value?.title ?? 'document';
                exportHtml(parsedHtml.value, title);
                closePalette();
            },
        },
        {
            id: 'export-pdf',
            label: 'Print / Export PDF',
            category: 'Export',
            keywords: ['print', 'pdf', 'export', 'save'],
            run: () => { window.print(); closePalette(); },
        },
        {
            id: 'copy-html',
            label: 'Copy HTML to Clipboard',
            category: 'Export',
            keywords: ['copy', 'html', 'clipboard'],
            run: () => {
                navigator.clipboard.writeText(parsedHtml.value).then(() => {
                    showToast('HTML copied to clipboard', 'success');
                });
                closePalette();
            },
        },
        {
            id: 'share-url',
            label: 'Copy Share URL',
            category: 'Share',
            keywords: ['share', 'url', 'link', 'copy'],
            run: () => {
                const url = buildShareUrl(markdownSource.value);
                if (!url) { showToast('Document too large for URL share', 'error'); }
                else navigator.clipboard.writeText(url).then(() => showToast('Share URL copied!', 'success'));
                closePalette();
            },
        },
        {
            id: 'toggle-theme',
            label: 'Toggle Dark / Light Mode',
            category: 'View',
            keywords: ['theme', 'dark', 'light', 'mode', 'toggle', 'color'],
            run: () => { toggleTheme(); closePalette(); },
        },
        {
            id: 'focus-mode',
            label: 'Toggle Focus Mode',
            category: 'View',
            keywords: ['focus', 'mode', 'distraction', 'zen'],
            run: () => { toggleFocusMode(); closePalette(); },
        },
        {
            id: 'typewriter-mode',
            label: 'Toggle Typewriter Mode',
            category: 'View',
            keywords: ['typewriter', 'scroll', 'center', 'mode'],
            run: () => { toggleTypewriterMode(); closePalette(); },
        },
        {
            id: 'outline',
            label: 'Toggle Outline Sidebar',
            category: 'View',
            keywords: ['outline', 'sidebar', 'headings', 'toc', 'navigation'],
            run: () => { toggleOutline(); closePalette(); },
        },
        {
            id: 'find-replace',
            label: 'Find & Replace',
            category: 'Edit',
            keywords: ['find', 'replace', 'search', 'text'],
            shortcut: 'Ctrl+H',
            run: () => {
                closePalette();
                setTimeout(() => {
                    const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true });
                    document.dispatchEvent(event);
                }, 50);
            },
        },
        {
            id: 'zen',
            label: 'Toggle Zen Mode',
            category: 'View',
            keywords: ['zen', 'fullscreen', 'distraction', 'focus', 'immersive'],
            shortcut: 'Ctrl+Shift+F',
            run: () => { toggleZenMode(); closePalette(); },
        },
        {
            id: 'toggle-vim',
            label: 'Toggle Vim Mode',
            category: 'Editor',
            keywords: ['vim', 'vi', 'keybindings', 'modal'],
            run: () => { toggleVimMode(); closePalette(); },
        },
        {
            id: 'new-template',
            label: 'New from Template…',
            category: 'File',
            keywords: ['template', 'new', 'create', 'blog', 'readme', 'journal', 'meeting'],
            run: () => { openTemplateModal(); closePalette(); },
        },
    ];
}

const fuse = new Fuse(getActions(), {
    keys: [
        { name: 'label', weight: 0.7 },
        { name: 'keywords', weight: 0.3 },
    ],
    threshold: 0.35,
    includeScore: true,
});

interface DocHit { id: string; title: string; snippet: string; }

export function CommandPalette() {
    const isOpen = paletteOpen.value;
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const isDocSearch = query.startsWith('/');
    const docTerm = isDocSearch ? query.slice(1) : '';

    const actions = getActions();
    const commandResults = isDocSearch ? [] : (query.trim() ? fuse.search(query).map(r => r.item) : actions);

    const docResults: DocHit[] = isDocSearch ? (() => {
        const docs = docList.value;
        if (!docTerm.trim()) return docs.map(d => ({ id: d.id, title: d.title, snippet: '' }));
        const docFuse = new Fuse(docs, {
            keys: [{ name: 'title', weight: 0.5 }, { name: 'content', weight: 0.5 }],
            threshold: 0.4,
            includeMatches: true,
        });
        return docFuse.search(docTerm).map(r => {
            const match = r.matches?.find(m => m.key === 'content');
            let snippet = '';
            if (match && match.indices[0]) {
                const [start] = match.indices[0];
                snippet = r.item.content.slice(Math.max(0, start - 15), start + 65).replace(/\n/g, ' ').trim();
            }
            return { id: r.item.id, title: r.item.title, snippet };
        });
    })() : [];

    const totalResults = isDocSearch ? docResults.length : commandResults.length;

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIdx(0);
            setTimeout(() => inputRef.current?.focus(), 10);
            if (listRef.current) autoAnimate(listRef.current, { duration: 100, easing: 'ease-out' });
        }
    }, [isOpen]);

    useEffect(() => { setActiveIdx(0); }, [query]);

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, totalResults - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (isDocSearch) {
                const hit = docResults[activeIdx];
                if (hit) { setActiveDoc(hit.id); closePalette(); }
            } else {
                commandResults[activeIdx]?.run();
            }
        } else if (e.key === 'Escape') {
            closePalette();
        }
    }

    useEffect(() => {
        const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    if (!isOpen) return null;

    return (
        <>
            <div class="cmd-backdrop" onClick={closePalette} />
            <div class="cmd-palette" role="dialog" aria-label="Command Palette" aria-modal="true">
                <div class="cmd-input-row">
                    <Search size={16} color="var(--c-muted)" strokeWidth={2} />
                    <input
                        ref={inputRef}
                        class="cmd-input"
                        placeholder="Type a command… or / to search documents"
                        value={query}
                        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                        onKeyDown={handleKeyDown as unknown as (e: Event) => void}
                        aria-autocomplete="list"
                        autocomplete="off"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>ESC</span>
                </div>
                <div class="cmd-list" ref={listRef} role="listbox">
                    {totalResults === 0 && (
                        <div class="cmd-empty">
                            {isDocSearch ? `No documents match "${docTerm}"` : `No commands found for "${query}"`}
                        </div>
                    )}
                    {isDocSearch ? docResults.map((hit, i) => (
                        <div
                            key={hit.id}
                            class={`cmd-item${i === activeIdx ? ' cmd-item--active' : ''}`}
                            role="option"
                            aria-selected={i === activeIdx}
                            onMouseEnter={() => setActiveIdx(i)}
                            onClick={() => { setActiveDoc(hit.id); closePalette(); }}
                        >
                            <FileText size={13} style={{ flexShrink: 0, color: 'var(--c-muted)' }} />
                            <span class="cmd-item__label" style={{ fontWeight: 600 }}>{hit.title}</span>
                            {hit.snippet && <span class="cmd-item__category" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hit.snippet}</span>}
                        </div>
                    )) : commandResults.map((action, i) => (
                        <div
                            key={action.id}
                            class={`cmd-item${i === activeIdx ? ' cmd-item--active' : ''}`}
                            role="option"
                            aria-selected={i === activeIdx}
                            onMouseEnter={() => setActiveIdx(i)}
                            onClick={() => action.run()}
                        >
                            <span class="cmd-item__label">{action.label}</span>
                            <span class="cmd-item__category">{action.category}</span>
                            {action.shortcut && (
                                <span class="cmd-item__shortcut">{action.shortcut}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
