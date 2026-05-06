import { useState } from 'preact/hooks';
import { ChevronDown, FileDown, FileCode2, Clipboard, Printer } from 'lucide-react';
import { markdownSource, parsedHtml } from '@/store/editor';
import { activeDoc } from '@/store/documents';
import { exportMarkdown, exportHtml } from '@/lib/export';
import { showToast } from '@/store/toast';

export function ExportMenu() {
    const [open, setOpen] = useState(false);
    const title = activeDoc.value?.title ?? 'document';

    function handleExportMd() { exportMarkdown(markdownSource.value, title); setOpen(false); }
    function handleExportHtml() { exportHtml(parsedHtml.value, title); setOpen(false); }
    function handleCopyHtml() {
        navigator.clipboard.writeText(parsedHtml.value).then(() => {
            showToast('HTML copied to clipboard', 'success');
            setOpen(false);
        });
    }

    const items = [
        { label: 'Download .md',     icon: <FileDown size={13} strokeWidth={2} />,  action: handleExportMd },
        { label: 'Download .html',   icon: <FileCode2 size={13} strokeWidth={2} />, action: handleExportHtml },
        { label: 'Copy HTML',        icon: <Clipboard size={13} strokeWidth={2} />, action: handleCopyHtml },
        { label: 'Print / Export PDF', icon: <Printer size={13} strokeWidth={2} />, action: () => { setOpen(false); setTimeout(() => window.print(), 100); } },
    ];

    return (
        <div style={{ position: 'relative' }}>
            <button
                class="btn-icon"
                aria-haspopup="true"
                aria-expanded={open}
                data-tooltip="Export"
                onClick={() => setOpen((v) => !v)}
                style={{
                    borderColor: open ? 'var(--c-accent)' : undefined,
                    color: open ? 'var(--c-accent)' : undefined,
                    gap: '4px',
                    padding: '4px 10px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-ui)',
                }}
            >
                Export <ChevronDown size={12} strokeWidth={2.5} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
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
                        class="dropdown-menu"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            right: 0,
                            zIndex: 10,
                            backgroundColor: 'var(--c-surface-raised)',
                            border: '1px solid var(--c-border-strong)',
                            borderRadius: 'var(--r-md)',
                            padding: '6px',
                            minWidth: '170px',
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                        }}
                    >
                        {items.map((item) => (
                            <button
                                key={item.label}
                                role="menuitem"
                                class="export-item"
                                onClick={item.action}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
