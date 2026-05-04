import { useEffect, useState } from 'preact/hooks';
import { Command, Swords, Home } from 'lucide-react';
import { EditorPane } from './EditorPane';
import { PreviewPane } from './PreviewPane';
import { DocumentTabs } from './DocumentTabs';
import { ThemeToggle } from './ThemeToggle';
import { ExportMenu } from './ExportMenu';
import { StatusBar } from './StatusBar';
import { UpdateBanner } from './UpdateBanner';
import { ShareButton } from './ShareButton';
import { OutlineSidebar } from './OutlineSidebar';
import { ResizeHandle } from './ResizeHandle';
import { CommandPalette } from './CommandPalette';
import { ToastStack } from './Toast';
import { activeDoc } from '@/store/documents';
import { showOutline } from '@/store/settings';
import { splitRatio } from '@/store/layout';
import { openPalette } from '@/store/commandPalette';
import { enterBattleMode, returnToMenu } from '@/store/appMode';

// ── Service worker update detection ──────────────────────────────────
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
    const ratio = splitRatio.value;

    if (!_swUpdateCallback) _swUpdateCallback = () => setShowUpdate(true);

    function handleSwUpdate() {
        _swReg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }

    // Global Ctrl+Shift+P → command palette
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                openPalette();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {showUpdate && <UpdateBanner onUpdate={handleSwUpdate} />}

            {/* ── Header ── */}
            <header class="app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ color: 'var(--c-accent)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px', flexShrink: 0, fontFamily: 'var(--font-ui)' }}>
                        M4rkdown
                    </span>
                    {docTitle && (
                        <span style={{ color: 'var(--c-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)' }}>
                            — {docTitle}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                        class="btn-icon"
                        data-tooltip="Command Palette"
                        data-tooltip-shortcut="Ctrl+Shift+P"
                        aria-label="Open command palette"
                        onClick={openPalette}
                    >
                        <Command size={15} strokeWidth={1.75} />
                    </button>
                    <ShareButton />
                    <button
                        class="btn-icon"
                        data-tooltip="Battle Mode"
                        aria-label="Enter battle mode"
                        onClick={enterBattleMode}
                        style={{ color: '#ef4444', borderColor: 'var(--c-border)' }}
                    >
                        <Swords size={15} strokeWidth={1.75} />
                    </button>
                    <ExportMenu />
                    <ThemeToggle />
                    <button
                        class="btn-icon"
                        data-tooltip="Main Menu"
                        aria-label="Return to main menu"
                        onClick={returnToMenu}
                    >
                        <Home size={15} strokeWidth={1.75} />
                    </button>
                    <a
                        href="https://github.com/zhenxiao-yu/m4rkdown-editor"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View on GitHub"
                        class="btn-icon github-link"
                        data-tooltip="View on GitHub"
                        style={{ textDecoration: 'none', fontSize: '13px', fontFamily: 'var(--font-ui)', padding: '4px 8px' }}
                    >
                        GitHub
                    </a>
                </div>
            </header>

            {/* ── Document tabs ── */}
            <DocumentTabs />

            {/* ── Split pane + optional outline sidebar ── */}
            <div class="split-pane" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ width: `${ratio * 100}%`, overflow: 'hidden', minWidth: 0, flexShrink: 0 }}>
                    <EditorPane />
                </div>
                <ResizeHandle />
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <PreviewPane />
                </div>
                {showOutline.value && (
                    <div class="outline-panel" style={{ overflow: 'hidden' }}>
                        <OutlineSidebar />
                    </div>
                )}
            </div>

            {/* ── Status bar ── */}
            <StatusBar />

            {/* ── Overlays ── */}
            <CommandPalette />
            <ToastStack />

            <style>{`
                @media (max-width: 480px) { .github-link { display: none; } }
                @media (max-width: 767px) {
                    .split-pane { flex-direction: column !important; }
                    .split-pane > div { flex: none !important; height: calc(50vh - 56px) !important; overflow: hidden !important; }
                    .outline-panel { display: none !important; }
                    .resize-handle { display: none !important; }
                }
            `}</style>
        </div>
    );
}
