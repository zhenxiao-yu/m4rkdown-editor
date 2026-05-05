import { useEffect, useRef } from 'preact/hooks';
import { effect } from '@preact/signals';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { openSearchPanel } from '@codemirror/search';
import { markdownSource, activeTab } from '@/store/editor';
import { activeDocId, updateDocContent } from '@/store/documents';
import { theme } from '@/store/theme';
import { focusMode, typewriterMode, vimMode, vimModeLabel, toggleVimMode } from '@/store/settings';
import { editorScrollFraction, layoutMode } from '@/store/layout';
import { debounce } from '@/lib/debounce';
import { focusModeExtension, typewriterModeExtension, editorBaseTheme } from '@/lib/cm-extensions';
import { Toolbar } from './Toolbar';
import {
    boldCommand, italicCommand, linkCommand,
    inlineCodeCommand, codeBlockCommand,
    heading1Command, heading2Command, heading3Command,
    bulletListCommand, orderedListCommand, blockquoteCommand,
} from '@/lib/codemirror-commands';

// Compartments for hot-swappable extensions
const themeComp = new Compartment();
const focusComp = new Compartment();
const typewriterComp = new Compartment();
const vimComp = new Compartment();

function getThemeExt(t: 'dark' | 'light') {
    return t === 'light' ? githubLight : oneDark;
}

export function EditorPane() {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // exposed for Toolbar
    function getView() { return viewRef.current; }

    useEffect(() => {
        if (viewRef.current || !containerRef.current) return;

        const debouncedSave = debounce((content: string) => {
            updateDocContent(activeDocId.value, content);
        }, 300);

        const state = EditorState.create({
            doc: markdownSource.value,
            extensions: [
                basicSetup,
                markdown(),
                editorBaseTheme,
                themeComp.of(getThemeExt(theme.value)),
                focusComp.of([]),
                typewriterComp.of([]),
                vimComp.of([]),
                keymap.of([
                    { key: 'Ctrl-b', run: boldCommand },
                    { key: 'Ctrl-i', run: italicCommand },
                    { key: 'Ctrl-k', run: linkCommand },
                    { key: 'Ctrl-`', run: inlineCodeCommand },
                    { key: 'Ctrl-Shift-k', run: codeBlockCommand },
                    { key: 'Ctrl-h', run: openSearchPanel },
                    { key: 'Mod-h', run: openSearchPanel },
                    { key: 'Ctrl-1', run: heading1Command },
                    { key: 'Ctrl-2', run: heading2Command },
                    { key: 'Ctrl-3', run: heading3Command },
                    { key: 'Ctrl-Shift-8', run: bulletListCommand },
                    { key: 'Ctrl-Shift-7', run: orderedListCommand },
                    { key: 'Ctrl-Shift-.', run: blockquoteCommand },
                ]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) debouncedSave(update.state.doc.toString());
                }),
            ],
        });

        viewRef.current = new EditorView({ state, parent: containerRef.current });
        const view = viewRef.current;

        // F4: Editor scroll → sync preview
        const onEditorScroll = () => {
            if (layoutMode.value !== 'split') return;
            const dom = view.scrollDOM;
            const max = dom.scrollHeight - dom.clientHeight;
            editorScrollFraction.value = max > 0 ? dom.scrollTop / max : 0;
        };
        view.scrollDOM.addEventListener('scroll', onEditorScroll, { passive: true });

        // F7: Vim mode compartment
        const stopVim = effect(() => {
            // vim() loaded lazily to avoid bundle impact when unused
            if (vimMode.value) {
                import('@replit/codemirror-vim').then(({ vim }) => {
                    viewRef.current?.dispatch({ effects: vimComp.reconfigure(vim()) });
                });
            } else {
                viewRef.current?.dispatch({ effects: vimComp.reconfigure([]) });
            }
        });

        // F7: Vim mode label indicator
        function onVimChange(e: Event) {
            const m = (e as CustomEvent<{ mode: string }>).detail?.mode ?? '';
            vimModeLabel.value = m === 'normal' ? '-- NORMAL --'
                : m === 'insert' ? '-- INSERT --'
                : m === 'visual' ? '-- VISUAL --'
                : '';
        }
        view.dom.addEventListener('vim-mode-change', onVimChange);

        // F1: Image paste + drag-drop
        function insertImageFile(file: File, name: string) {
            const reader = new FileReader();
            reader.onload = () => {
                const md = `![${name}](${reader.result as string})`;
                const v = viewRef.current;
                if (!v) return;
                const { from } = v.state.selection.main;
                v.dispatch({ changes: { from, to: from, insert: md } });
                v.focus();
            };
            reader.readAsDataURL(file);
        }

        function handlePaste(e: ClipboardEvent) {
            const imageItem = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
            if (!imageItem) return;
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (!file) return;
            insertImageFile(file, 'pasted-image');
        }
        function handleDragOver(e: DragEvent) {
            if (Array.from(e.dataTransfer?.items ?? []).some(i => i.type.startsWith('image/'))) e.preventDefault();
        }
        function handleDrop(e: DragEvent) {
            const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
            if (!files.length) return;
            e.preventDefault();
            files.forEach(f => insertImageFile(f, f.name.replace(/\.[^.]+$/, '') || 'image'));
        }
        view.dom.addEventListener('paste', handlePaste);
        view.dom.addEventListener('dragover', handleDragOver);
        view.dom.addEventListener('drop', handleDrop);

        // Sync content when doc switches
        const stopContent = effect(() => {
            const incoming = markdownSource.value;
            if (!viewRef.current) return;
            const current = viewRef.current.state.doc.toString();
            if (current !== incoming) {
                viewRef.current.dispatch({ changes: { from: 0, to: current.length, insert: incoming } });
            }
        });

        // Swap theme when app theme changes
        const stopTheme = effect(() => {
            viewRef.current?.dispatch({ effects: themeComp.reconfigure(getThemeExt(theme.value)) });
        });

        // Toggle focus mode
        const stopFocus = effect(() => {
            viewRef.current?.dispatch({
                effects: focusComp.reconfigure(focusMode.value ? focusModeExtension : []),
            });
        });

        // Toggle typewriter mode
        const stopTypewriter = effect(() => {
            viewRef.current?.dispatch({
                effects: typewriterComp.reconfigure(typewriterMode.value ? typewriterModeExtension : []),
            });
        });

        return () => {
            view.scrollDOM.removeEventListener('scroll', onEditorScroll);
            view.dom.removeEventListener('vim-mode-change', onVimChange);
            view.dom.removeEventListener('paste', handlePaste);
            view.dom.removeEventListener('dragover', handleDragOver);
            view.dom.removeEventListener('drop', handleDrop);
            stopContent();
            stopTheme();
            stopFocus();
            stopTypewriter();
            stopVim();
            viewRef.current?.destroy();
            viewRef.current = null;
        };
    }, []);

    const hidden = activeTab.value !== 'preview' && activeTab.value !== 'tree' && activeTab.value !== 'source';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Toolbar getView={getView} />
            <div
                ref={containerRef}
                style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: hidden ? 'none' : 'block' }}
            />
        </div>
    );
}
