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
import { focusMode, typewriterMode } from '@/store/settings';
import { debounce } from '@/lib/debounce';
import { focusModeExtension, typewriterModeExtension, editorBaseTheme } from '@/lib/cm-extensions';
import { Toolbar } from './Toolbar';
import {
    boldCommand, italicCommand, linkCommand,
    inlineCodeCommand, codeBlockCommand
} from '@/lib/codemirror-commands';

// Compartments for hot-swappable extensions
const themeComp = new Compartment();
const focusComp = new Compartment();
const typewriterComp = new Compartment();

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
                keymap.of([
                    { key: 'Ctrl-b', run: boldCommand },
                    { key: 'Ctrl-i', run: italicCommand },
                    { key: 'Ctrl-k', run: linkCommand },
                    { key: 'Ctrl-`', run: inlineCodeCommand },
                    { key: 'Ctrl-Shift-k', run: codeBlockCommand },
                    { key: 'Ctrl-h', run: openSearchPanel },
                    { key: 'Mod-h', run: openSearchPanel },
                ]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) debouncedSave(update.state.doc.toString());
                }),
            ],
        });

        viewRef.current = new EditorView({ state, parent: containerRef.current });

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
            stopContent();
            stopTheme();
            stopFocus();
            stopTypewriter();
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
