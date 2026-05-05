import { EditorView } from '@codemirror/view';
import { undo, redo, indentMore, indentLess, moveLineUp, moveLineDown } from '@codemirror/commands';

export function undoCommand(view: EditorView): boolean { return undo(view); }
export function redoCommand(view: EditorView): boolean { return redo(view); }
export function indentMoreCommand(view: EditorView): boolean { return indentMore(view); }
export function indentLessCommand(view: EditorView): boolean { return indentLess(view); }
export function moveLineUpCommand(view: EditorView): boolean { return moveLineUp(view); }
export function moveLineDownCommand(view: EditorView): boolean { return moveLineDown(view); }

function wrapSelection(view: EditorView, wrap: string, fallback: string): boolean {
    const { from, to } = view.state.selection.main;
    const text = view.state.doc.sliceString(from, to);
    view.dispatch({
        changes: { from, to, insert: `${wrap}${text || fallback}${wrap}` },
        selection: { anchor: from + wrap.length, head: from + wrap.length + (text || fallback).length },
    });
    view.focus();
    return true;
}

export function boldCommand(view: EditorView): boolean {
    return wrapSelection(view, '**', 'bold text');
}

export function italicCommand(view: EditorView): boolean {
    return wrapSelection(view, '_', 'italic text');
}

export function strikethroughCommand(view: EditorView): boolean {
    return wrapSelection(view, '~~', 'strikethrough');
}

export function inlineCodeCommand(view: EditorView): boolean {
    return wrapSelection(view, '`', 'code');
}

export function linkCommand(view: EditorView): boolean {
    const { from, to } = view.state.selection.main;
    const text = view.state.doc.sliceString(from, to);
    const insert = `[${text || 'link text'}](url)`;
    view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + insert.length - 4, head: from + insert.length - 1 },
    });
    view.focus();
    return true;
}

export function codeBlockCommand(view: EditorView): boolean {
    const { from, to } = view.state.selection.main;
    const text = view.state.doc.sliceString(from, to);
    const insert = `\`\`\`\n${text || 'code here'}\n\`\`\``;
    view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + 4, head: from + 4 + (text || 'code here').length },
    });
    view.focus();
    return true;
}

export function tableCommand(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    const insert = `| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n`;
    view.dispatch({ changes: { from, to: from, insert } });
    view.focus();
    return true;
}

export function hrCommand(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    view.dispatch({ changes: { from, to: from, insert: '\n---\n' } });
    view.focus();
    return true;
}

function toggleLinePrefix(view: EditorView, prefix: string): boolean {
    const { state } = view;
    const { from, to } = state.selection.main;
    const startLine = state.doc.lineAt(from);
    const endLine = state.doc.lineAt(to);
    let allHave = true;
    for (let n = startLine.number; n <= endLine.number; n++) {
        if (!state.doc.line(n).text.startsWith(prefix)) { allHave = false; break; }
    }
    const changes: { from: number; to: number; insert: string }[] = [];
    for (let n = startLine.number; n <= endLine.number; n++) {
        const line = state.doc.line(n);
        if (allHave) changes.push({ from: line.from, to: line.from + prefix.length, insert: '' });
        else if (!line.text.startsWith(prefix)) changes.push({ from: line.from, to: line.from, insert: prefix });
    }
    view.dispatch({ changes });
    view.focus();
    return true;
}

function setHeadingCmd(view: EditorView, level: 1 | 2 | 3): boolean {
    const { state } = view;
    const line = state.doc.lineAt(state.selection.main.from);
    const target = '#'.repeat(level) + ' ';
    const stripped = line.text.replace(/^#{1,6}\s/, '');
    const insert = line.text === target + stripped ? stripped : target + stripped;
    view.dispatch({ changes: { from: line.from, to: line.to, insert } });
    view.focus();
    return true;
}

export const heading1Command = (v: EditorView) => setHeadingCmd(v, 1);
export const heading2Command = (v: EditorView) => setHeadingCmd(v, 2);
export const heading3Command = (v: EditorView) => setHeadingCmd(v, 3);
export const bulletListCommand = (v: EditorView) => toggleLinePrefix(v, '- ');
export const orderedListCommand = (v: EditorView) => toggleLinePrefix(v, '1. ');
export const blockquoteCommand = (v: EditorView) => toggleLinePrefix(v, '> ');
