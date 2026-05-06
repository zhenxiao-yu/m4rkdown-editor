import { X } from 'lucide-react';
import {
    focusMode, typewriterMode, showOutline, vimMode,
    toggleFocusMode, toggleTypewriterMode, toggleOutline, toggleVimMode,
    previewTheme, setPreviewTheme, PREVIEW_THEMES, wordGoal, setWordGoal,
    type PreviewTheme,
} from '@/store/settings';
import { layoutMode, setLayoutMode, type LayoutMode } from '@/store/layout';
import { toggleTheme } from '@/store/theme';
import { useState } from 'preact/hooks';

interface SettingsModalProps {
    onClose: () => void;
}

function Toggle({ label, desc, checked, onChange }: {
    label: string;
    desc?: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid var(--c-border)',
            cursor: 'pointer', gap: 16,
        }}>
            <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', fontFamily: 'var(--font-ui)' }}>{label}</div>
                {desc && <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>{desc}</div>}
            </div>
            <div
                onClick={onChange}
                style={{
                    width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                    background: checked ? 'var(--c-accent)' : 'var(--c-border)',
                    position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
            >
                <div style={{
                    position: 'absolute', top: 3, left: checked ? 19 : 3,
                    width: 14, height: 14, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
            </div>
        </label>
    );
}

export function SettingsModal({ onClose }: SettingsModalProps) {
    const [goalDraft, setGoalDraft] = useState(wordGoal.value > 0 ? String(wordGoal.value) : '');
    const mode = layoutMode.value;

    return (
        <>
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-label="Settings"
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 901,
                    width: 'min(480px, 94vw)',
                    maxHeight: '85vh',
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
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--c-text)' }}>Settings</span>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflow: 'auto', padding: '0 20px 20px' }}>

                    {/* Appearance */}
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-accent)', padding: '16px 0 8px', fontFamily: 'var(--font-ui)' }}>
                        Appearance
                    </div>

                    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', fontFamily: 'var(--font-ui)', marginBottom: 8 }}>Color theme</div>
                        <button
                            onClick={toggleTheme}
                            style={{ padding: '6px 14px', background: 'var(--c-btn)', border: '1px solid var(--c-border)', borderRadius: 6, color: 'var(--c-text)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12 }}
                        >
                            Toggle Light / Dark
                        </button>
                    </div>

                    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', fontFamily: 'var(--font-ui)', marginBottom: 8 }}>Preview theme</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {PREVIEW_THEMES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setPreviewTheme(t.id)}
                                    style={{
                                        padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                                        border: `1px solid ${previewTheme.value === t.id ? 'var(--c-accent)' : 'var(--c-border)'}`,
                                        borderRadius: 6,
                                        background: previewTheme.value === t.id ? 'color-mix(in srgb, var(--c-accent) 15%, var(--c-surface))' : 'var(--c-btn)',
                                        color: previewTheme.value === t.id ? 'var(--c-accent)' : 'var(--c-muted)',
                                        fontFamily: 'var(--font-ui)', fontWeight: previewTheme.value === t.id ? 700 : 400,
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', fontFamily: 'var(--font-ui)', marginBottom: 8 }}>Default layout</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {(['editor', 'split', 'preview'] as LayoutMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setLayoutMode(m)}
                                    style={{
                                        flex: 1, padding: '6px', fontSize: 11, cursor: 'pointer', textTransform: 'capitalize',
                                        border: `1px solid ${mode === m ? 'var(--c-accent)' : 'var(--c-border)'}`,
                                        borderRadius: 6,
                                        background: mode === m ? 'color-mix(in srgb, var(--c-accent) 15%, var(--c-surface))' : 'var(--c-btn)',
                                        color: mode === m ? 'var(--c-accent)' : 'var(--c-muted)',
                                        fontFamily: 'var(--font-ui)', fontWeight: mode === m ? 700 : 400,
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor */}
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-accent)', padding: '16px 0 4px', fontFamily: 'var(--font-ui)' }}>
                        Editor
                    </div>

                    <Toggle
                        label="Focus Mode"
                        desc="Dims lines far from the cursor for distraction-free editing"
                        checked={focusMode.value}
                        onChange={toggleFocusMode}
                    />
                    <Toggle
                        label="Typewriter Mode"
                        desc="Keeps the cursor centered vertically as you type"
                        checked={typewriterMode.value}
                        onChange={toggleTypewriterMode}
                    />
                    <Toggle
                        label="Vim Keybindings"
                        desc="Enable Vim modal editing (Normal / Insert / Visual modes)"
                        checked={vimMode.value}
                        onChange={toggleVimMode}
                    />
                    <Toggle
                        label="Document Outline"
                        desc="Show heading outline sidebar in split/editor view"
                        checked={showOutline.value}
                        onChange={toggleOutline}
                    />

                    {/* Writing */}
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-accent)', padding: '16px 0 4px', fontFamily: 'var(--font-ui)' }}>
                        Writing
                    </div>

                    <div style={{ padding: '10px 0' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', fontFamily: 'var(--font-ui)', marginBottom: 6 }}>Word goal</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="number"
                                min="0"
                                max="100000"
                                value={goalDraft}
                                placeholder="e.g. 500"
                                onInput={(e) => setGoalDraft((e.target as HTMLInputElement).value)}
                                style={{
                                    width: 100, padding: '5px 8px', fontSize: 13,
                                    background: 'var(--c-btn)', border: '1px solid var(--c-border)',
                                    borderRadius: 6, color: 'var(--c-text)', fontFamily: 'var(--font-mono)',
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={() => { setWordGoal(parseInt(goalDraft, 10) || 0); }}
                                style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', background: 'var(--c-accent)', color: 'var(--c-accent-fg)', border: 'none', borderRadius: 6, fontFamily: 'var(--font-ui)' }}
                            >
                                Set
                            </button>
                            {wordGoal.value > 0 && (
                                <button
                                    onClick={() => { setWordGoal(0); setGoalDraft(''); }}
                                    style={{ padding: '5px 10px', fontSize: 11, cursor: 'pointer', background: 'none', color: 'var(--c-danger)', border: '1px solid var(--c-border)', borderRadius: 6, fontFamily: 'var(--font-ui)' }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {wordGoal.value > 0 && (
                            <div style={{ fontSize: 11, color: '#22c55e', marginTop: 6, fontFamily: 'var(--font-ui)' }}>
                                ✓ Goal set: {wordGoal.value.toLocaleString()} words
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
