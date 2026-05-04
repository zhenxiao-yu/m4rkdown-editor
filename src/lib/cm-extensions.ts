import { ViewPlugin, Decoration, type DecorationSet, type ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// ── Focus mode — dims lines far from cursor ───────────────────────────

const dimLine = Decoration.line({ class: 'cm-focus-dim' });

class FocusModePlugin {
    decorations: DecorationSet = Decoration.none;

    update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view: EditorView): DecorationSet {
        const { from } = view.state.selection.main;
        const activeLine = view.state.doc.lineAt(from).number;
        const builder = new RangeSetBuilder<Decoration>();

        for (const { from: rFrom, to: rTo } of view.visibleRanges) {
            let line = view.state.doc.lineAt(rFrom);
            while (line.from <= rTo) {
                if (Math.abs(line.number - activeLine) > 3) {
                    builder.add(line.from, line.from, dimLine);
                }
                if (line.to >= view.state.doc.length) break;
                line = view.state.doc.lineAt(line.to + 1);
            }
        }

        return builder.finish();
    }
}

export const focusModeExtension = ViewPlugin.fromClass(FocusModePlugin, {
    decorations: (v) => v.decorations,
});

// ── Typewriter mode — locks cursor to vertical center ─────────────────

class TypewriterPlugin {
    update(update: ViewUpdate) {
        if (!update.selectionSet && !update.docChanged) return;
        const { view } = update;
        const { from } = view.state.selection.main;
        const coords = view.coordsAtPos(from);
        if (!coords) return;
        const dom = view.scrollDOM;
        const rect = dom.getBoundingClientRect();
        dom.scrollTop += coords.top - rect.top - rect.height / 2;
    }
}

export const typewriterModeExtension = ViewPlugin.fromClass(TypewriterPlugin);

// ── Shared base theme (layout/font only, not colors) ─────────────────

export const editorBaseTheme = EditorView.baseTheme({
    '&': { height: '100%' },
    '.cm-content': {
        padding: '16px 20px',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
        fontSize: '14px',
        lineHeight: '1.75',
        caretColor: 'var(--c-accent)',
    },
    '.cm-gutters': {
        borderRight: '1px solid var(--c-border)',
        padding: '0 4px',
    },
    '.cm-cursor': { borderLeftColor: 'var(--c-accent)', borderLeftWidth: '2px' },
    '.cm-focused .cm-cursor': { borderLeftColor: 'var(--c-accent)' },
    '&.cm-focused': { outline: 'none' },
    // Focus mode dim class
    '.cm-focus-dim': { opacity: '0.25', transition: 'opacity 0.1s' },
    // Search panel
    '.cm-search': { padding: '8px 12px', backgroundColor: 'var(--c-surface)' },
    '.cm-search input': {
        backgroundColor: 'var(--c-btn)',
        color: 'var(--c-text)',
        border: '1px solid var(--c-border)',
        borderRadius: '4px',
        padding: '3px 8px',
        fontFamily: 'inherit',
    },
    '.cm-search button': {
        backgroundColor: 'var(--c-btn)',
        color: 'var(--c-text)',
        border: '1px solid var(--c-border)',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '3px 8px',
    },
    '.cm-search label': { color: 'var(--c-muted)', fontSize: '12px' },
    '.cm-textfield': {
        backgroundColor: 'var(--c-btn) !important',
        color: 'var(--c-text) !important',
    },
    '.cm-panel': { backgroundColor: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' },
    '.cm-panel.cm-search [name=close]': { color: 'var(--c-muted)', cursor: 'pointer' },
});
