import { X } from 'lucide-react';

interface ShortcutGroup {
    title: string;
    rows: { key: string; desc: string }[];
}

const GROUPS: ShortcutGroup[] = [
    {
        title: 'Format',
        rows: [
            { key: 'Ctrl+B',       desc: 'Bold' },
            { key: 'Ctrl+I',       desc: 'Italic' },
            { key: 'Ctrl+`',       desc: 'Inline code' },
            { key: 'Ctrl+K',       desc: 'Insert link' },
            { key: 'Ctrl+Shift+K', desc: 'Code block' },
            { key: 'Ctrl+1/2/3',   desc: 'Heading 1 / 2 / 3' },
            { key: 'Ctrl+Shift+8', desc: 'Bullet list' },
            { key: 'Ctrl+Shift+7', desc: 'Ordered list' },
            { key: 'Ctrl+Shift+.', desc: 'Blockquote' },
        ],
    },
    {
        title: 'Editor',
        rows: [
            { key: 'Ctrl+Z',       desc: 'Undo' },
            { key: 'Ctrl+Y',       desc: 'Redo' },
            { key: 'Ctrl+F',       desc: 'Find' },
            { key: 'Ctrl+H',       desc: 'Find & Replace' },
            { key: 'Tab',          desc: 'Indent' },
            { key: 'Shift+Tab',    desc: 'Outdent' },
        ],
    },
    {
        title: 'View',
        rows: [
            { key: 'Ctrl+\\',      desc: 'Cycle layout (Editor / Split / Preview)' },
            { key: 'Ctrl+Shift+F', desc: 'Toggle Zen / Fullscreen mode' },
            { key: 'Ctrl+P',       desc: 'Command Palette' },
            { key: '?',            desc: 'This shortcuts help' },
        ],
    },
    {
        title: 'File',
        rows: [
            { key: 'Ctrl+N',       desc: 'New document' },
            { key: 'Ctrl+S',       desc: 'Save (auto-saved, triggers PWA sync)' },
        ],
    },
    {
        title: 'Export',
        rows: [
            { key: 'Ctrl+P (browser)', desc: 'Print / Export to PDF' },
        ],
    },
];

interface ShortcutsModalProps {
    onClose: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
    return (
        <>
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-label="Keyboard shortcuts"
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 901,
                    width: 'min(600px, 94vw)',
                    maxHeight: '80vh',
                    background: 'var(--c-surface-raised)',
                    border: '1px solid var(--c-border-strong)',
                    borderRadius: 'var(--r-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'palette-in 0.18s cubic-bezier(0.16,1,0.3,1) both',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--c-text)' }}>Keyboard Shortcuts</span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflow: 'auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                    {GROUPS.map(g => (
                        <div key={g.title}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-accent)', marginBottom: 8, fontFamily: 'var(--font-ui)' }}>
                                {g.title}
                            </div>
                            {g.rows.map(r => (
                                <div key={r.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                                    <kbd style={{
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        background: 'var(--c-btn)',
                                        border: '1px solid var(--c-border)',
                                        borderBottom: '2px solid var(--c-border-strong)',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--c-text)',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0,
                                    }}>
                                        {r.key}
                                    </kbd>
                                    <span style={{ fontSize: 12, color: 'var(--c-muted)', fontFamily: 'var(--font-ui)' }}>{r.desc}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 20px', borderTop: '1px solid var(--c-border)', flexShrink: 0, fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--font-ui)' }}>
                    Press <kbd style={{ padding: '0 5px', background: 'var(--c-btn)', border: '1px solid var(--c-border)', borderRadius: 3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>?</kbd> or <kbd style={{ padding: '0 5px', background: 'var(--c-btn)', border: '1px solid var(--c-border)', borderRadius: 3, fontSize: 10, fontFamily: 'var(--font-mono)' }}>Esc</kbd> to close
                </div>
            </div>
        </>
    );
}
