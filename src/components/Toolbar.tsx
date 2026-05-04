import { EditorView } from '@codemirror/view';
import { openSearchPanel } from '@codemirror/search';
import { Link, Search, Focus, AlignCenter, PanelRight, Code, FileCode, Table, Minus } from 'lucide-react';
import {
    boldCommand, italicCommand, strikethroughCommand,
    inlineCodeCommand, linkCommand, codeBlockCommand, tableCommand, hrCommand
} from '@/lib/codemirror-commands';
import { focusMode, typewriterMode, showOutline, toggleFocusMode, toggleTypewriterMode, toggleOutline } from '@/store/settings';

// Icon sizes: toolbar actions = size 14, strokeWidth 2

interface ToolbarProps { getView: () => EditorView | null; }

interface FormatBtn {
    label: string | preact.JSX.Element;
    tooltip: string;
    shortcut?: string;
    action: (v: EditorView) => void;
    bold?: boolean;
    italic?: boolean;
    mono?: boolean;
    strike?: boolean;
}

const FORMAT_BTNS: FormatBtn[] = [
    { label: 'B',   tooltip: 'Bold',        shortcut: 'Ctrl+B', action: boldCommand,          bold: true },
    { label: 'I',   tooltip: 'Italic',       shortcut: 'Ctrl+I', action: italicCommand,        italic: true },
    { label: 'S',   tooltip: 'Strikethrough',                    action: strikethroughCommand, strike: true },
    { label: <Code size={14} strokeWidth={2} />, tooltip: 'Inline code', shortcut: 'Ctrl+`', action: inlineCodeCommand },
    { label: <Link size={14} strokeWidth={2} />, tooltip: 'Link',        shortcut: 'Ctrl+K', action: linkCommand },
    { label: <FileCode size={14} strokeWidth={2} />, tooltip: 'Code block', shortcut: 'Ctrl+Shift+K', action: codeBlockCommand },
    { label: <Table size={14} strokeWidth={2} />, tooltip: 'Insert table',                    action: tableCommand },
    { label: <Minus size={14} strokeWidth={2} />, tooltip: 'Horizontal rule',                 action: hrCommand },
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
            {FORMAT_BTNS.map((btn) => (
                <button
                    key={btn.tooltip}
                    data-tooltip={btn.tooltip}
                    data-tooltip-shortcut={btn.shortcut}
                    class="toolbar-btn"
                    onClick={() => run(btn.action)}
                    style={{
                        fontWeight: btn.bold ? 700 : 400,
                        fontStyle: btn.italic ? 'italic' : 'normal',
                        fontFamily: (btn.bold || btn.italic || btn.strike) ? 'var(--font-ui)' : undefined,
                        fontSize: (btn.bold || btn.italic || btn.strike) ? '13px' : undefined,
                        textDecoration: btn.strike ? 'line-through' : 'none',
                        padding: '4px 8px',
                    }}
                    aria-label={btn.tooltip}
                >
                    {btn.label}
                </button>
            ))}

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--c-border)', margin: '0 4px', flexShrink: 0 }} />

            <button
                class="toolbar-btn"
                data-tooltip="Find & Replace"
                data-tooltip-shortcut="Ctrl+H"
                aria-label="Find & Replace"
                onClick={() => { const v = getView(); if (v) openSearchPanel(v); }}
                style={{ padding: '4px 8px' }}
            >
                <Search size={14} strokeWidth={2} />
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--c-border)', margin: '0 4px', flexShrink: 0 }} />

            <button
                class={`toolbar-btn${isFocus ? ' toolbar-btn--active' : ''}`}
                data-tooltip="Focus Mode"
                aria-label="Toggle focus mode"
                aria-pressed={isFocus}
                onClick={toggleFocusMode}
                style={{ padding: '4px 8px' }}
            >
                <Focus size={14} strokeWidth={2} />
            </button>
            <button
                class={`toolbar-btn${isTypewriter ? ' toolbar-btn--active' : ''}`}
                data-tooltip="Typewriter Mode"
                aria-label="Toggle typewriter mode"
                aria-pressed={isTypewriter}
                onClick={toggleTypewriterMode}
                style={{ padding: '4px 8px' }}
            >
                <AlignCenter size={14} strokeWidth={2} />
            </button>
            <button
                class={`toolbar-btn${isOutline ? ' toolbar-btn--active' : ''}`}
                data-tooltip="Document Outline"
                aria-label="Toggle document outline"
                aria-pressed={isOutline}
                onClick={toggleOutline}
                style={{ padding: '4px 8px' }}
            >
                <PanelRight size={14} strokeWidth={2} />
            </button>
        </div>
    );
}
