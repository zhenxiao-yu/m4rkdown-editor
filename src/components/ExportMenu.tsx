import { useState, useRef } from 'preact/hooks';
import { ChevronDown, FileDown, FileCode2, Clipboard, Printer, DatabaseBackup, Upload } from 'lucide-react';
import { markdownSource, parsedHtml } from '@/store/editor';
import { activeDoc, buildBackup, importBackup } from '@/store/documents';
import { exportMarkdown, exportHtml } from '@/lib/export';
import { showToast } from '@/store/toast';

export function ExportMenu() {
    const [open, setOpen] = useState(false);
    const title = activeDoc.value?.title ?? 'document';
    const importInputRef = useRef<HTMLInputElement>(null);

    function handleExportMd() { exportMarkdown(markdownSource.value, title); setOpen(false); }
    function handleExportHtml() { exportHtml(parsedHtml.value, title); setOpen(false); }
    function handleCopyHtml() {
        navigator.clipboard.writeText(parsedHtml.value).then(() => {
            showToast('HTML copied to clipboard', 'success');
            setOpen(false);
        });
    }

    function handleExportBackup() {
        const backup = buildBackup();
        const json = JSON.stringify(backup, null, 2);
        const date = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        a.download = `m4rkdown-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        setOpen(false);
    }

    function handleImportBackup() {
        setOpen(false);
        importInputRef.current?.click();
    }

    function handleImportFile(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        (e.target as HTMLInputElement).value = '';
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const raw = JSON.parse(reader.result as string);
                const { imported, skipped } = importBackup(raw);
                if (imported === 0 && skipped > 0) {
                    showToast(`All ${skipped} document${skipped !== 1 ? 's' : ''} already exist — nothing imported.`, 'info');
                } else {
                    showToast(`Imported ${imported} document${imported !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} already existed)` : ''}.`, 'success');
                }
            } catch {
                showToast('Could not import backup — invalid file format.', 'error', 6000);
            }
        };
        reader.readAsText(file);
    }

    const items = [
        { label: 'Download .md',     icon: <FileDown size={13} strokeWidth={2} />,  action: handleExportMd },
        { label: 'Download .html',   icon: <FileCode2 size={13} strokeWidth={2} />, action: handleExportHtml },
        { label: 'Copy HTML',        icon: <Clipboard size={13} strokeWidth={2} />, action: handleCopyHtml },
        { label: 'Print / Export PDF', icon: <Printer size={13} strokeWidth={2} />, action: () => { setOpen(false); setTimeout(() => window.print(), 100); } },
        null,
        { label: 'Export all (backup)', icon: <DatabaseBackup size={13} strokeWidth={2} />, action: handleExportBackup },
        { label: 'Import backup',        icon: <Upload size={13} strokeWidth={2} />,         action: handleImportBackup },
    ];

    return (
        <div style={{ position: 'relative' }}>
            <input
                ref={importInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />
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
                            minWidth: '185px',
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                        }}
                    >
                        {items.map((item, i) =>
                            item === null
                                ? <div key={i} style={{ height: 1, background: 'var(--c-border)', margin: '4px 2px' }} />
                                : (
                                    <button
                                        key={item.label}
                                        role="menuitem"
                                        class="export-item"
                                        onClick={item.action}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                )
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
