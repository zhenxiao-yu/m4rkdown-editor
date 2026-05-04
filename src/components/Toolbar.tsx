import { EditorView } from '@codemirror/view';
import {
    boldCommand, italicCommand, strikethroughCommand,
    inlineCodeCommand, linkCommand, codeBlockCommand, tableCommand, hrCommand
} from '@/lib/codemirror-commands';

interface ToolbarProps {
    getView: () => EditorView | null;
}

interface ToolBtn { label: string; title: string; action: (v: EditorView) => void; bold?: boolean; italic?: boolean; mono?: boolean; }

const BUTTONS: ToolBtn[] = [
    { label: 'B',   title: 'Bold (Ctrl+B)',   action: boldCommand,          bold: true },
    { label: 'I',   title: 'Italic (Ctrl+I)', action: italicCommand,        italic: true },
    { label: 'S',   title: 'Strikethrough',   action: strikethroughCommand },
    { label: '<>',  title: 'Inline Code',     action: inlineCodeCommand,    mono: true },
    { label: '🔗',  title: 'Link (Ctrl+K)',   action: linkCommand },
    { label: '```', title: 'Code Block',      action: codeBlockCommand,     mono: true },
    { label: '⊞',   title: 'Table',           action: tableCommand },
    { label: '—',   title: 'Horizontal Rule', action: hrCommand },
];

export function Toolbar({ getView }: ToolbarProps) {
    function run(action: (v: EditorView) => void) {
        const view = getView();
        if (view) action(view);
    }

    return (
        <div style={{
            display: 'flex',
            gap: '4px',
            padding: '6px 12px',
            borderBottom: '1px solid var(--c-border)',
            backgroundColor: 'var(--c-surface-alt)',
            flexShrink: 0,
            flexWrap: 'wrap',
        }}>
            {BUTTONS.map((btn) => (
                <button
                    key={btn.title}
                    title={btn.title}
                    class="toolbar-btn"
                    onClick={() => run(btn.action)}
                    style={{
                        fontWeight: btn.bold ? 700 : 400,
                        fontStyle: btn.italic ? 'italic' : 'normal',
                        fontFamily: btn.mono ? "'Courier New', monospace" : 'inherit',
                        fontSize: btn.mono ? '11px' : '13px',
                        textDecoration: btn.label === 'S' ? 'line-through' : 'none',
                    }}
                    aria-label={btn.title}
                >
                    {btn.label === 'S' ? 'S' : btn.label}
                </button>
            ))}
        </div>
    );
}
