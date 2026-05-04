import { EditorView } from '@codemirror/view';

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
