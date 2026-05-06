import { useState, useRef, useEffect } from 'preact/hooks';
import confetti from 'canvas-confetti';
import { markdownSource } from '@/store/editor';
import { focusMode, typewriterMode, wordGoal, setWordGoal, vimMode, vimModeLabel, isOffline } from '@/store/settings';
import { collabPeerCount, collabConnected } from '@/store/collab';
import { lintMarkdown, type LintWarning } from '@/lib/markdown-lint';

function countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 3) return 1;
    const vowels = w.replace(/e$/, '').match(/[aeiouy]+/g);
    return Math.max(1, vowels?.length ?? 1);
}

function fleschScore(text: string): number | null {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (sentences.length === 0 || words.length < 10) return null;
    const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
    const score = 206.835
        - 1.015 * (words.length / sentences.length)
        - 84.6 * (syllables / words.length);
    return Math.round(Math.max(0, Math.min(100, score)));
}

function readabilityLabel(score: number): string {
    if (score >= 90) return 'Very Easy';
    if (score >= 70) return 'Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
}

export function StatusBar() {
    const src = markdownSource.value;
    const words = src.trim() === '' ? 0 : src.trim().split(/\s+/).length;
    const chars = src.length;
    const lines = src === '' ? 0 : src.split('\n').length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    const flesch = fleschScore(src);
    const isFocus = focusMode.value;
    const isTypewriter = typewriterMode.value;
    const goal = wordGoal.value;
    const isVim = vimMode.value;
    const vimLabel = vimModeLabel.value;

    const [showGoalInput, setShowGoalInput] = useState(false);
    const [goalDraft, setGoalDraft] = useState('');
    const [showLintPanel, setShowLintPanel] = useState(false);
    const offline = isOffline.value;
    const peersOnline = collabConnected.value ? collabPeerCount.value : 0;

    // Lint — only run when doc is non-trivial
    const lintWarnings: LintWarning[] = words >= 5 ? lintMarkdown(src) : [];
    const lintErrors = lintWarnings.filter(w => w.severity === 'error').length;
    const lintWarns  = lintWarnings.filter(w => w.severity === 'warning').length;

    const pct = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0;
    const goalMet = goal > 0 && words >= goal;

    const lastMilestonePct = useRef<number>(pct);
    useEffect(() => {
        for (const m of [25, 50, 75, 100]) {
            if (pct >= m && lastMilestonePct.current < m) {
                confetti({ particleCount: m === 100 ? 120 : 40, spread: 70, origin: { x: 0.5, y: 0.9 } });
            }
        }
        lastMilestonePct.current = pct;
    }, [pct]);

    return (
        <div style={{ flexShrink: 0 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0 16px',
                height: '28px',
                backgroundColor: 'var(--c-surface-alt)',
                borderTop: '1px solid var(--c-border)',
                fontSize: '11px',
                color: 'var(--c-muted)',
                fontFamily: 'var(--font-ui)',
                userSelect: 'none',
                overflowX: 'auto',
                position: 'relative',
            }}>
                <button
                    class="status-goal-btn"
                    title={goal > 0 ? `Goal: ${goal} words — click to change` : 'Click to set word goal'}
                    onClick={() => { setGoalDraft(goal > 0 ? String(goal) : ''); setShowGoalInput(v => !v); }}
                >
                    {goal > 0 ? `${words.toLocaleString()}/${goal.toLocaleString()}w` : `${words.toLocaleString()}w`}
                </button>
                {showGoalInput && (
                    <div class="status-goal-popover">
                        <input
                            type="number" min="1" max="100000"
                            value={goalDraft} placeholder="500"
                            onInput={(e) => setGoalDraft((e.target as HTMLInputElement).value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { setWordGoal(parseInt(goalDraft, 10) || 0); setShowGoalInput(false); }
                                if (e.key === 'Escape') setShowGoalInput(false);
                            }}
                            style={{ width: 70, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--c-btn)', border: '1px solid var(--c-border)', color: 'var(--c-text)', borderRadius: 4, padding: '2px 4px' }}
                            autoFocus
                        />
                        <button onClick={() => { setWordGoal(parseInt(goalDraft, 10) || 0); setShowGoalInput(false); }}
                            style={{ fontSize: 11, cursor: 'pointer', background: 'var(--c-accent)', color: 'var(--c-accent-fg)', border: 'none', borderRadius: 3, padding: '2px 6px' }}>
                            Set
                        </button>
                        {goal > 0 && (
                            <button onClick={() => { setWordGoal(0); setShowGoalInput(false); }}
                                style={{ fontSize: 10, cursor: 'pointer', background: 'none', color: 'var(--c-muted)', border: 'none', padding: '2px 4px' }}>
                                Clear
                            </button>
                        )}
                    </div>
                )}
                <Sep />
                <span title="Character count">{chars.toLocaleString()}c</span>
                <Sep />
                <span title="Line count">{lines.toLocaleString()}L</span>
                <Sep />
                <span title="Estimated reading time">~{readTime} min</span>
                {flesch !== null && (
                    <>
                        <Sep />
                        <span title={`Flesch reading ease: ${flesch}/100`} style={{ color: fleschColor(flesch) }}>
                            Flesch {flesch} · {readabilityLabel(flesch)}
                        </span>
                    </>
                )}

                <div style={{ flex: 1 }} />

                {isVim && vimLabel && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-accent)', fontWeight: 700 }}>
                        {vimLabel}
                    </span>
                )}
                {isFocus && <Pill label="Focus" />}
                {isTypewriter && <Pill label="Typewriter" />}
                {offline && <Pill label="Offline" color="var(--c-danger)" />}
                {peersOnline > 0 && <Pill label={`${peersOnline + 1} online`} color="var(--c-success)" />}
                {lintWarnings.length > 0 && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowLintPanel(v => !v)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                color: lintErrors > 0 ? 'var(--c-danger)' : '#f59e0b',
                                fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 700,
                            }}
                            title="Markdown lint warnings — click for details"
                        >
                            {lintErrors > 0 ? `⛔ ${lintErrors} error${lintErrors !== 1 ? 's' : ''}` : `⚠️ ${lintWarns} hint${lintWarns !== 1 ? 's' : ''}`}
                        </button>
                        {showLintPanel && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowLintPanel(false)} />
                                <div style={{
                                    position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                                    zIndex: 50, minWidth: 280, maxWidth: 360,
                                    background: 'var(--c-surface-raised)',
                                    border: '1px solid var(--c-border-strong)',
                                    borderRadius: 'var(--r-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    padding: '8px 0',
                                    fontFamily: 'var(--font-ui)',
                                }}>
                                    <div style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-muted)', borderBottom: '1px solid var(--c-border)' }}>
                                        Lint ({lintWarnings.length})
                                    </div>
                                    {lintWarnings.map((w, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 12px', fontSize: 11 }}>
                                            <span style={{ color: w.severity === 'error' ? 'var(--c-danger)' : '#f59e0b', flexShrink: 0, fontWeight: 700 }}>
                                                {w.severity === 'error' ? '⛔' : '⚠️'}
                                            </span>
                                            <span style={{ color: 'var(--c-muted)' }}>L{w.line}</span>
                                            <span style={{ color: 'var(--c-text)' }}>{w.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
                <span style={{ color: 'var(--c-border)' }}>M4rkdown v2.1</span>
            </div>
            {goal > 0 && (
                <div style={{ height: 3, backgroundColor: 'var(--c-border)' }}>
                    <div style={{
                        height: '100%', width: `${pct}%`,
                        backgroundColor: goalMet ? 'var(--c-success)' : 'var(--c-accent)',
                        transition: 'width 0.4s ease, background-color 0.3s ease',
                    }} />
                </div>
            )}
        </div>
    );
}

function Sep() {
    return <span style={{ color: 'var(--c-border)' }}>·</span>;
}

function Pill({ label, color = 'var(--c-accent)' }: { label: string; color?: string }) {
    return (
        <span style={{
            backgroundColor: color,
            color: 'var(--c-accent-fg)',
            borderRadius: '4px',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.04em',
        }}>
            {label}
        </span>
    );
}

function fleschColor(score: number): string {
    if (score >= 70) return 'var(--c-success)';
    if (score >= 50) return 'var(--c-muted)';
    return 'var(--c-danger)';
}
