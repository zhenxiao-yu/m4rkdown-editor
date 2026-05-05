import { useState } from 'preact/hooks';
import { markdownSource } from '@/store/editor';
import { focusMode, typewriterMode, wordGoal, setWordGoal, vimMode, vimModeLabel } from '@/store/settings';

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

    const pct = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0;
    const goalMet = goal > 0 && words >= goal;

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

function Pill({ label }: { label: string }) {
    return (
        <span style={{
            backgroundColor: 'var(--c-accent)',
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
