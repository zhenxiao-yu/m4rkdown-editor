import { useState } from 'preact/hooks';
import { markdownSource, parsedHtml } from '@/store/editor';
import { activeDoc } from '@/store/documents';
import { exportMarkdown, exportHtml } from '@/lib/export';

export function ExportMenu() {
    const [open, setOpen] = useState(false);
    const title = activeDoc.value?.title ?? 'document';

    function handleExportMd() { exportMarkdown(markdownSource.value, title); setOpen(false); }
    function handleExportHtml() { exportHtml(parsedHtml.value, title); setOpen(false); }
    function handleCopyHtml() {
        navigator.clipboard.writeText(parsedHtml.value).then(() => setOpen(false));
    }

    return (
        <div style={{ position: 'relative' }}>
            <button
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${open ? 'var(--c-accent)' : 'var(--c-border)'}`,
                    backgroundColor: open ? 'var(--c-accent)' : 'var(--c-btn)',
                    color: open ? 'var(--c-accent-fg)' : 'var(--c-text)',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
            >
                Export ▾
            </button>
            {open && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        role="menu"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            right: 0,
                            zIndex: 10,
                            backgroundColor: 'var(--c-surface)',
                            border: '1px solid var(--c-border)',
                            borderRadius: '8px',
                            padding: '6px',
                            minWidth: '160px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                        }}
                    >
                        {[
                            { label: 'Download .md',   action: handleExportMd },
                            { label: 'Download .html', action: handleExportHtml },
                            { label: 'Copy HTML',      action: handleCopyHtml },
                        ].map((item) => (
                            <button
                                key={item.label}
                                role="menuitem"
                                class="export-item"
                                onClick={item.action}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
