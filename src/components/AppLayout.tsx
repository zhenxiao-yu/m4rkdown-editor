import { useEffect, useState } from 'preact/hooks';
import { effect } from '@preact/signals';
import { Command, Swords, Home, PanelLeft, Columns2, PanelRight, Maximize2, Minimize2, Settings } from 'lucide-react';
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
import { TemplateModal } from './TemplateModal';
import { ShortcutsModal } from './ShortcutsModal';
import { SettingsModal } from './SettingsModal';
import { activeDoc, storageWasCorrupted } from '@/store/documents';
import { showOutline, zenMode, toggleZenMode, isOffline } from '@/store/settings';
import { showToast } from '@/store/toast';
import { splitRatio, layoutMode, setLayoutMode, type LayoutMode } from '@/store/layout';
import { openPalette, templateModalOpen, closeTemplateModal } from '@/store/commandPalette';
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
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const ratio = splitRatio.value;
    const mode = layoutMode.value;
    const isZen = zenMode.value;

    if (!_swUpdateCallback) _swUpdateCallback = () => setShowUpdate(true);

    function handleSwUpdate() {
        _swReg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }

    // Corruption recovery toast — fires once on mount if the previous session's storage was unreadable
    useEffect(() => {
        if (storageWasCorrupted) {
            showToast(
                'Previous session data was unreadable — started fresh. Export a backup to protect your work.',
                'error',
                10000,
            );
        }
    }, []);

    // Online / offline indicator
    useEffect(() => {
        const onOffline = () => { isOffline.value = true; };
        const onOnline  = () => { isOffline.value = false; showToast('Back online', 'success'); };
        window.addEventListener('offline', onOffline);
        window.addEventListener('online',  onOnline);
        return () => { window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline); };
    }, []);

    // Global keyboard shortcuts + zen fullscreen sync
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault(); openPalette();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
                e.preventDefault();
                const modes: LayoutMode[] = ['editor', 'split', 'preview'];
                setLayoutMode(modes[(modes.indexOf(layoutMode.value) + 1) % 3]);
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
                e.preventDefault(); toggleZenMode();
            }
            // ? key — only when no input/textarea is focused
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
                if (tag !== 'input' && tag !== 'textarea' && !(document.activeElement as HTMLElement)?.isContentEditable) {
                    e.preventDefault();
                    setShowShortcuts(v => !v);
                }
            }
            if (e.key === 'Escape') setShowShortcuts(false);
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Fullscreen sync with zen mode
    useEffect(() => {
        const stop = effect(() => {
            if (zenMode.value) {
                document.documentElement.requestFullscreen?.().catch(() => {});
            } else if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
        });
        const onFsChange = () => { if (!document.fullscreenElement) zenMode.value = false; };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => { stop(); document.removeEventListener('fullscreenchange', onFsChange); };
    }, []);

    const editorPaneStyle = mode === 'editor'
        ? { width: '100%', overflow: 'hidden', minWidth: 0, flexShrink: 0 as const }
        : mode === 'preview'
        ? { width: 0, overflow: 'hidden', minWidth: 0, flexShrink: 0 as const }
        : { width: `${ratio * 100}%`, overflow: 'hidden', minWidth: 0, flexShrink: 0 as const };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {showUpdate && <UpdateBanner onUpdate={handleSwUpdate} />}

            {/* ── Header ── */}
            {!isZen && (
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
                        {/* Layout mode buttons */}
                        {(['editor', 'split', 'preview'] as LayoutMode[]).map(m => (
                            <button
                                key={m}
                                class={`btn-icon${mode === m ? ' btn-icon--active' : ''}`}
                                data-tooltip={m === 'editor' ? 'Editor Only (Ctrl+\\)' : m === 'split' ? 'Split View' : 'Preview Only'}
                                aria-label={m === 'editor' ? 'Editor only' : m === 'split' ? 'Split view' : 'Preview only'}
                                onClick={() => setLayoutMode(m)}
                            >
                                {m === 'editor'  && <PanelLeft  size={15} strokeWidth={1.75} />}
                                {m === 'split'   && <Columns2   size={15} strokeWidth={1.75} />}
                                {m === 'preview' && <PanelRight size={15} strokeWidth={1.75} />}
                            </button>
                        ))}
                        <button
                            class="btn-icon"
                            data-tooltip="Zen Mode (Ctrl+Shift+F)"
                            aria-label="Toggle zen mode"
                            onClick={toggleZenMode}
                        >
                            <Maximize2 size={15} strokeWidth={1.75} />
                        </button>
                        <button
                            class="btn-icon"
                            data-tooltip="Command Palette"
                            data-tooltip-shortcut="Ctrl+Shift+P"
                            aria-label="Open command palette"
                            onClick={openPalette}
                        >
                            <Command size={15} strokeWidth={1.75} />
                        </button>
                        <button
                            class="btn-icon"
                            data-tooltip="Keyboard Shortcuts"
                            data-tooltip-shortcut="?"
                            aria-label="Show keyboard shortcuts"
                            onClick={() => setShowShortcuts(v => !v)}
                            style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 700, padding: '4px 8px' }}
                        >
                            ?
                        </button>
                        <button
                            class="btn-icon"
                            data-tooltip="Settings"
                            aria-label="Open settings"
                            onClick={() => setShowSettings(v => !v)}
                        >
                            <Settings size={15} strokeWidth={1.75} />
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
            )}

            {/* ── Document tabs ── */}
            {!isZen && <DocumentTabs />}

            {/* ── Split pane + optional outline sidebar ── */}
            <div class="split-pane" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                <div style={editorPaneStyle}>
                    <EditorPane />
                </div>
                {mode === 'split' && <ResizeHandle />}
                {mode !== 'editor' && (
                    <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                        <PreviewPane />
                    </div>
                )}
                {showOutline.value && mode !== 'preview' && (
                    <div class="outline-panel" style={{ overflow: 'hidden' }}>
                        <OutlineSidebar />
                    </div>
                )}
            </div>

            {/* ── Status bar ── */}
            {!isZen && <StatusBar />}

            {/* ── Zen hover strip ── */}
            {isZen && (
                <div class="zen-hover-strip">
                    <button onClick={toggleZenMode} style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: 12, cursor: 'pointer' }}>
                        <Minimize2 size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Exit Zen · Ctrl+Shift+F
                    </button>
                </div>
            )}

            {/* ── Overlays ── */}
            <CommandPalette />
            <ToastStack />
            {templateModalOpen.value && <TemplateModal onClose={closeTemplateModal} />}
            {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

        </div>
    );
}
