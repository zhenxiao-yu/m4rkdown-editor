import { useEffect, useRef } from 'preact/hooks';
import { effect } from '@preact/signals';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { markdownSource, activeTab } from '@/store/editor';
import { activeDocId, updateDocContent } from '@/store/documents';
import { debounce } from '@/lib/debounce';
import { Toolbar } from './Toolbar';
import {
    boldCommand, italicCommand, linkCommand,
    inlineCodeCommand, codeBlockCommand
} from '@/lib/codemirror-commands';

export function EditorPane() {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

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
                oneDark,
                keymap.of([
                    { key: 'Ctrl-b', run: boldCommand },
                    { key: 'Ctrl-i', run: italicCommand },
                    { key: 'Ctrl-k', run: linkCommand },
                    { key: 'Ctrl-`', run: inlineCodeCommand },
                    { key: 'Ctrl-Shift-k', run: codeBlockCommand },
                ]),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        debouncedSave(update.state.doc.toString());
                    }
                }),
                EditorView.theme({
                    '&': { height: '100%', backgroundColor: '#1e1e1e' },
                    '&.cm-focused': { outline: 'none' },
                    '.cm-content': {
                        padding: '16px',
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: '14px',
                        lineHeight: '1.7',
                    },
                    '.cm-gutters': {
                        backgroundColor: '#1e1e1e',
                        borderRight: '1px solid #3c3c3c',
                        color: '#555',
                    },
                    '.cm-activeLineGutter': { backgroundColor: '#252526' },
                    '.cm-activeLine': { backgroundColor: '#252526' },
                    '.cm-cursor': { borderLeftColor: '#f7df4b' },
                    '.cm-selectionBackground': { backgroundColor: '#3a3a3a !important' },
                    '.cm-selectionMatch': { backgroundColor: '#2d4a6a' },
                }),
            ],
        });

        viewRef.current = new EditorView({
            state,
            parent: containerRef.current,
        });

        // Sync CM with markdownSource when it changes externally (doc switch)
        const stopEffect = effect(() => {
            const incoming = markdownSource.value;
            if (!viewRef.current) return;
            const cmContent = viewRef.current.state.doc.toString();
            if (cmContent !== incoming) {
                viewRef.current.dispatch({
                    changes: { from: 0, to: cmContent.length, insert: incoming },
                });
            }
        });

        return () => {
            stopEffect();
            viewRef.current?.destroy();
            viewRef.current = null;
        };
    }, []);

    function getView() { return viewRef.current; }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Toolbar getView={getView} />
            <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }} />
        </div>
    );
}
