import { useState } from 'preact/hooks';
import { EditorPane } from './EditorPane';
import { PreviewPane } from './PreviewPane';
import { DocumentTabs } from './DocumentTabs';
import { ThemeToggle } from './ThemeToggle';
import { ExportMenu } from './ExportMenu';
import { StatusBar } from './StatusBar';
import { UpdateBanner } from './UpdateBanner';
import { ShareButton } from './ShareButton';
import { activeDoc } from '@/store/documents';

// ── Service worker update detection ──────────────────────────────
let _swReg: ServiceWorkerRegistration | null = null;
let _swUpdateCallback: (() => void) | null = null;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((reg) => {
        _swReg = reg;
        reg.addEventListener('updatefound', () => {
            const next = reg.installing;
            if (!next) return;
            next.addEventListener('statechange', () => {
                if (next.state === 'installed' && navigator.serviceWorker.controller) {
                    _swUpdateCallback?.();
                }
            });
        });
    }).catch(() => {/* dev — no sw.js */});
}

export function AppLayout() {
    const docTitle = activeDoc.value?.title ?? '';
    const [showUpdate, setShowUpdate] = useState(false);

    if (!_swUpdateCallback) {
        _swUpdateCallback = () => setShowUpdate(true);
    }

    function handleSwUpdate() {
        _swReg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {showUpdate && <UpdateBanner onUpdate={handleSwUpdate} />}

            {/* ── Header ── */}
            <header style={{
                backgroundColor: 'var(--c-header)',
                borderBottom: '1px solid var(--c-border)',
                padding: '0 16px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxShadow: '0 1px 0 var(--c-border)',
                gap: '12px',
            }}>
                {/* Brand + doc title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                    <span style={{
                        color: 'var(--c-accent)',
                        fontWeight: 700,
                        fontSize: '18px',
                        letterSpacing: '-0.5px',
                        flexShrink: 0,
                    }}>
                        M4rkdown
                    </span>
                    {docTitle && (
                        <span style={{
                            color: 'var(--c-muted)',
                            fontSize: '13px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            — {docTitle}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <ShareButton />
                    <ExportMenu />
                    <ThemeToggle />
                    <a
                        href="https://github.com/zhenxiao-yu/m4rkdown-editor"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on GitHub"
                        class="btn-icon github-link"
                        style={{ textDecoration: 'none', fontSize: '13px', padding: '4px 8px' }}
                    >
                        GitHub
                    </a>
                </div>
            </header>

            {/* ── Document tabs ── */}
            <DocumentTabs />

            {/* ── Split pane ── */}
            <div class="split-pane" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <EditorPane />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <PreviewPane />
                </div>
            </div>

            {/* ── Status bar ── */}
            <StatusBar />

            <style>{`
                /* Header: hide GitHub link text on very small screens */
                @media (max-width: 480px) {
                    .github-link { display: none; }
                }

                /* Mobile: stack editor above preview */
                /* Heights: 100vh - header(48) - tabs(36) - statusbar(28) = calc area */
                /* Each pane = half of remaining */
                @media (max-width: 767px) {
                    .split-pane {
                        flex-direction: column !important;
                    }
                    .split-pane > div {
                        flex: none !important;
                        height: calc(50vh - 56px) !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>
        </div>
    );
}
