import { useEffect, useRef, useState } from 'preact/hooks';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { paletteOpen, closePalette, openTemplateModal } from '@/store/commandPalette';
import { toggleFocusMode, toggleTypewriterMode, toggleOutline, toggleZenMode, toggleVimMode } from '@/store/settings';
import { toggleTheme } from '@/store/theme';
import { createDoc } from '@/store/documents';
import { markdownSource, parsedHtml } from '@/store/editor';
import { activeDoc } from '@/store/documents';
import { exportMarkdown, exportHtml } from '@/lib/export';
import { buildShareUrl } from '@/lib/share';
import { showToast } from '@/store/toast';

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

export function CommandPalette() {
    const isOpen = paletteOpen.value;
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const actions = getActions();
    const results = query.trim()
        ? fuse.search(query).map(r => r.item)
        : actions;

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIdx(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    useEffect(() => { setActiveIdx(0); }, [query]);

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            results[activeIdx]?.run();
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
                        placeholder="Type a command or search…"
                        value={query}
                        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                        onKeyDown={handleKeyDown as unknown as (e: Event) => void}
                        aria-autocomplete="list"
                        autocomplete="off"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>ESC</span>
                </div>
                <div class="cmd-list" ref={listRef} role="listbox">
                    {results.length === 0 && (
                        <div class="cmd-empty">No commands found for "{query}"</div>
                    )}
                    {results.map((action, i) => (
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
