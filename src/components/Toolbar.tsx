import { EditorView } from '@codemirror/view';
import { openSearchPanel } from '@codemirror/search';
import {
    boldCommand, italicCommand, strikethroughCommand,
    inlineCodeCommand, linkCommand, codeBlockCommand, tableCommand, hrCommand
} from '@/lib/codemirror-commands';
import { focusMode, typewriterMode, showOutline, toggleFocusMode, toggleTypewriterMode, toggleOutline } from '@/store/settings';

interface ToolbarProps { getView: () => EditorView | null; }

interface FormatBtn { label: string; title: string; action: (v: EditorView) => void; bold?: boolean; italic?: boolean; mono?: boolean; strike?: boolean; }

const FORMAT_BTNS: FormatBtn[] = [
    { label: 'B',    title: 'Bold (Ctrl+B)',          action: boldCommand,          bold: true },
    { label: 'I',    title: 'Italic (Ctrl+I)',         action: italicCommand,        italic: true },
    { label: 'S',    title: 'Strikethrough',            action: strikethroughCommand, strike: true },
    { label: '</>',  title: 'Inline code (Ctrl+`)',    action: inlineCodeCommand,    mono: true },
    { label: '🔗',   title: 'Link (Ctrl+K)',           action: linkCommand },
    { label: '```',  title: 'Code block (Ctrl+Shift+K)', action: codeBlockCommand,  mono: true },
    { label: '⊞',    title: 'Insert table',            action: tableCommand },
    { label: '─',    title: 'Horizontal rule',         action: hrCommand },
];

export function Toolbar({ getView }: ToolbarProps) {
    function run(action: (v: EditorView) => void) {
        const view = getView();
        if (view) action(view);
    }

    const isFocus = focusMode.value;
    const isTypewriter = typewriterMode.value;
    const isOutline = showOutline.value;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '5px 10px',
            borderBottom: '1px solid var(--c-border)',
            backgroundColor: 'var(--c-surface-alt)',
            flexShrink: 0,
            flexWrap: 'wrap',
        }}>
            {/* Formatting buttons */}
            {FORMAT_BTNS.map((btn) => (
                <button
                    key={btn.title}
                    title={btn.title}
                    class="toolbar-btn"
                    onClick={() => run(btn.action)}
                    style={{
                        fontWeight: btn.bold ? 700 : 400,
                        fontStyle: btn.italic ? 'italic' : 'normal',
                        fontFamily: btn.mono ? "'Courier New', monospace" : 'inherit',
                        fontSize: btn.mono ? '10px' : '13px',
                        textDecoration: btn.strike ? 'line-through' : 'none',
                    }}
                    aria-label={btn.title}
                >
                    {btn.label}
                </button>
            ))}

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--c-border)', margin: '0 4px', flexShrink: 0 }} />

            {/* Find & Replace */}
            <button
                class="toolbar-btn"
                title="Find & Replace (Ctrl+H)"
                aria-label="Find & Replace"
                onClick={() => { const v = getView(); if (v) openSearchPanel(v); }}
            >
                🔍
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--c-border)', margin: '0 4px', flexShrink: 0 }} />

            {/* Mode toggles */}
            <button
                class={`toolbar-btn${isFocus ? ' toolbar-btn--active' : ''}`}
                title={`Focus mode ${isFocus ? '(on)' : '(off)'}`}
                aria-label="Toggle focus mode"
                aria-pressed={isFocus}
                onClick={toggleFocusMode}
            >
                ◎
            </button>
            <button
                class={`toolbar-btn${isTypewriter ? ' toolbar-btn--active' : ''}`}
                title={`Typewriter mode ${isTypewriter ? '(on)' : '(off)'}`}
                aria-label="Toggle typewriter mode"
                aria-pressed={isTypewriter}
                onClick={toggleTypewriterMode}
            >
                ↕
            </button>
            <button
                class={`toolbar-btn${isOutline ? ' toolbar-btn--active' : ''}`}
                title={`Document outline ${isOutline ? '(on)' : '(off)'}`}
                aria-label="Toggle document outline"
                aria-pressed={isOutline}
                onClick={toggleOutline}
            >
                ≡
            </button>
        </div>
    );
}
