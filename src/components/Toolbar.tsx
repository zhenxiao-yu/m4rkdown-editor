import { EditorView } from '@codemirror/view';
import { openSearchPanel } from '@codemirror/search';
import { Link, Search, Focus, AlignCenter, PanelRight, Code, FileCode, Table, Minus, List, ListOrdered, TextQuote, Undo2, Redo2 } from 'lucide-react';
import {
    boldCommand, italicCommand, strikethroughCommand,
    inlineCodeCommand, linkCommand, codeBlockCommand, tableCommand, hrCommand,
    heading1Command, heading2Command, heading3Command,
    bulletListCommand, orderedListCommand, blockquoteCommand,
    undoCommand, redoCommand, indentMoreCommand, indentLessCommand,
} from '@/lib/codemirror-commands';
import { focusMode, typewriterMode, showOutline, toggleFocusMode, toggleTypewriterMode, toggleOutline, vimMode, toggleVimMode } from '@/store/settings';

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

const HEADING_BTNS: FormatBtn[] = [
    { label: 'H1', tooltip: 'Heading 1', shortcut: 'Ctrl+1', action: heading1Command, mono: true },
    { label: 'H2', tooltip: 'Heading 2', shortcut: 'Ctrl+2', action: heading2Command, mono: true },
    { label: 'H3', tooltip: 'Heading 3', shortcut: 'Ctrl+3', action: heading3Command, mono: true },
    { label: <List size={14} strokeWidth={2} />,        tooltip: 'Bullet List',   shortcut: 'Ctrl+Shift+8', action: bulletListCommand },
    { label: <ListOrdered size={14} strokeWidth={2} />, tooltip: 'Ordered List',  shortcut: 'Ctrl+Shift+7', action: orderedListCommand },
    { label: <TextQuote size={14} strokeWidth={2} />,   tooltip: 'Blockquote',    shortcut: 'Ctrl+Shift+.', action: blockquoteCommand },
];

export function Toolbar({ getView }: ToolbarProps) {
    function run(action: (v: EditorView) => void) {
        const view = getView();
        if (view) action(view);
    }

    const isFocus = focusMode.value;
    const isTypewriter = typewriterMode.value;
    const isOutline = showOutline.value;
    const isVim = vimMode.value;

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

            {HEADING_BTNS.map((btn) => (
                <button
                    key={btn.tooltip}
                    data-tooltip={btn.tooltip}
                    data-tooltip-shortcut={btn.shortcut}
                    class="toolbar-btn"
                    onClick={() => run(btn.action)}
                    style={{
                        fontFamily: btn.mono ? 'var(--font-mono)' : undefined,
                        fontSize: btn.mono ? '11px' : undefined,
                        fontWeight: btn.mono ? 700 : 400,
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

            <button class="toolbar-btn" data-tooltip="Undo" data-tooltip-shortcut="Ctrl+Z" aria-label="Undo" onClick={() => run(undoCommand)} style={{ padding: '4px 8px' }}>
                <Undo2 size={14} strokeWidth={2} />
            </button>
            <button class="toolbar-btn" data-tooltip="Redo" data-tooltip-shortcut="Ctrl+Y" aria-label="Redo" onClick={() => run(redoCommand)} style={{ padding: '4px 8px' }}>
                <Redo2 size={14} strokeWidth={2} />
            </button>
            <button class="toolbar-btn" data-tooltip="Indent" data-tooltip-shortcut="Tab" aria-label="Indent" onClick={() => run(indentMoreCommand)} style={{ padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                ⇥
            </button>
            <button class="toolbar-btn" data-tooltip="Outdent" data-tooltip-shortcut="Shift+Tab" aria-label="Outdent" onClick={() => run(indentLessCommand)} style={{ padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                ⇤
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
            <button
                class={`toolbar-btn${isVim ? ' toolbar-btn--active' : ''}`}
                data-tooltip="Vim Mode"
                aria-label="Toggle vim mode"
                aria-pressed={isVim}
                onClick={toggleVimMode}
                style={{ padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em' }}
            >
                VIM
            </button>
        </div>
    );
}
