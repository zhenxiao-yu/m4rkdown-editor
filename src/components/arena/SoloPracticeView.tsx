import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { RotateCcw, Play, Trophy, Zap, Target } from 'lucide-react';
import { ARENA_PROMPTS, getRandomPrompt } from '@/lib/arena-prompts';
import { calculateWpm, calculateAccuracy, calculateScore } from '@/lib/arena-scoring';
import type { ArenaPrompt } from '@/lib/arena-types';

// ── Module-level signals (reset on each practice) ─────────────────
const soloPrompt    = signal<ArenaPrompt | null>(null);
const soloTyped     = signal('');
const soloStartedAt = signal<number | null>(null);
const soloWpm       = signal(0);
const soloAccuracy  = signal(100);
const soloScore     = signal(0);
const soloFinished  = signal(false);
const soloCountdown = signal<number | null>(null); // 3,2,1 then null = go

function resetSolo() {
    soloTyped.value     = '';
    soloStartedAt.value = null;
    soloWpm.value       = 0;
    soloAccuracy.value  = 100;
    soloScore.value     = 0;
    soloFinished.value  = false;
    soloCountdown.value = null;
}

function pickPrompt() {
    resetSolo();
    soloPrompt.value = getRandomPrompt();
}

export function SoloPracticeView() {
    const prompt   = soloPrompt.value;
    const typed    = soloTyped.value;
    const wpm      = soloWpm.value;
    const accuracy = soloAccuracy.value;
    const score    = soloScore.value;
    const finished = soloFinished.value;
    const countdown = soloCountdown.value;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const shakeRef    = useRef<HTMLPreElement>(null);
    const prevLenRef  = useRef(0);

    // Focus textarea when game starts (countdown ends)
    useEffect(() => {
        if (countdown === null && prompt && !finished) {
            textareaRef.current?.focus();
        }
    }, [countdown, prompt, finished]);

    function startCountdown() {
        resetSolo();
        soloCountdown.value = 3;
        const t = setInterval(() => {
            soloCountdown.value = (soloCountdown.value ?? 1) - 1;
            if ((soloCountdown.value ?? 0) <= 0) {
                soloCountdown.value = null;
                clearInterval(t);
            }
        }, 1000);
    }

    function handleInput(e: Event) {
        if (!prompt || finished || soloCountdown.value !== null) return;

        const text = (e.target as HTMLTextAreaElement).value;
        const now = Date.now();

        if (!soloStartedAt.value && text.length > 0) {
            soloStartedAt.value = now;
        }

        const elapsed = soloStartedAt.value ? now - soloStartedAt.value : 0;
        const wpmCalc = calculateWpm(text.length, elapsed);
        const accCalc = calculateAccuracy(text, prompt.content);

        soloTyped.value   = text;
        soloWpm.value     = wpmCalc;
        soloAccuracy.value = accCalc;

        // Shake on new wrong char
        if (text.length > prevLenRef.current) {
            const i = text.length - 1;
            if (text[i] !== prompt.content[i] && shakeRef.current) {
                const el = shakeRef.current;
                el.classList.remove('game-shake');
                void el.offsetWidth; // force reflow
                el.classList.add('game-shake');
            }
        }
        prevLenRef.current = text.length;

        // Completion
        if (text === prompt.content) {
            soloFinished.value = true;
            const finalScore = calculateScore({
                netWpm: wpmCalc,
                accuracy: accCalc,
                timeMs: elapsed,
                promptEstimatedWords: prompt.estimatedWords,
            });
            soloScore.value = finalScore;
        }
    }

    // ── No prompt selected yet ────────────────────────────────────────
    if (!prompt) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40 }}>
                <div style={{ fontSize: 40 }}>⚡</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--c-text)', fontFamily: 'var(--font-ui)' }}>Solo Practice</div>
                <div style={{ color: 'var(--c-text-2)', fontSize: 14, textAlign: 'center', maxWidth: 360, fontFamily: 'var(--font-ui)' }}>
                    Practice typing markdown at your own pace. No pressure, no competition — just you and the keyboard.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
                    {ARENA_PROMPTS.slice(0, 4).map(p => (
                        <button
                            key={p.id}
                            onClick={() => { soloPrompt.value = p; startCountdown(); }}
                            style={{
                                padding: '12px 16px',
                                borderRadius: 10,
                                border: '1.5px solid var(--c-border)',
                                background: 'var(--c-surface-alt)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                fontFamily: 'var(--font-ui)',
                                transition: 'border-color 0.15s',
                            }}
                        >
                            <span style={{ fontSize: 13, color: 'var(--c-text)', fontWeight: 600 }}>{p.title}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span style={{
                                    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                    background: p.difficulty === 'easy' ? '#16a34a33' : p.difficulty === 'medium' ? '#d9770633' : '#dc262633',
                                    color: p.difficulty === 'easy' ? '#22c55e' : p.difficulty === 'medium' ? '#f59e0b' : '#f87171',
                                }}>
                                    {p.difficulty}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>~{p.estimatedWords}w</span>
                            </div>
                        </button>
                    ))}
                    <button
                        onClick={() => { pickPrompt(); startCountdown(); }}
                        class="arena-btn-primary"
                        style={{ marginTop: 4 }}
                    >
                        <Play size={14} /> Random Prompt
                    </button>
                </div>
            </div>
        );
    }

    // ── Countdown ─────────────────────────────────────────────────────
    if (countdown !== null) {
        const countColor = countdown === 3 ? '#dc2626' : countdown === 2 ? '#d97706' : '#16a34a';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, background: `${countColor}18` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)' }}>
                    Get ready…
                </div>
                <div
                    key={countdown}
                    class="arena-countdown-number"
                    style={{ fontSize: 120, fontWeight: 900, color: countColor, lineHeight: 1, textShadow: `0 0 40px ${countColor}88`, userSelect: 'none' }}
                >
                    {countdown}
                </div>
                <div style={{ fontSize: 14, color: 'var(--c-muted)', fontFamily: 'var(--font-ui)' }}>
                    {prompt.title}
                </div>
            </div>
        );
    }

    // ── Finished — show results ───────────────────────────────────────
    if (finished) {
        const wpmColor = wpm >= 60 ? 'var(--game-correct)' : wpm >= 30 ? 'var(--game-combo)' : 'var(--game-error)';
        const accColor = accuracy >= 95 ? 'var(--game-correct)' : accuracy >= 80 ? 'var(--game-combo)' : 'var(--game-error)';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: 40 }}>
                <div style={{ fontSize: 40 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--c-accent)', fontFamily: 'var(--font-ui)' }}>
                    Practice Complete!
                </div>

                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Stat icon={<Zap size={18} />} label="WPM" value={String(wpm)} color={wpmColor} />
                    <Stat icon={<Target size={18} />} label="Accuracy" value={`${accuracy}%`} color={accColor} />
                    <Stat icon={<Trophy size={18} />} label="Score" value={String(score)} color="var(--c-accent)" />
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        class="arena-btn-primary"
                        onClick={() => { resetSolo(); startCountdown(); }}
                    >
                        <RotateCcw size={14} /> Try Again
                    </button>
                    <button
                        class="btn-icon"
                        style={{ padding: '10px 20px', fontSize: 14 }}
                        onClick={() => { soloPrompt.value = null; resetSolo(); }}
                    >
                        Pick New Prompt
                    </button>
                </div>
            </div>
        );
    }

    // ── Active typing ─────────────────────────────────────────────────
    const chars  = prompt.content.split('');
    const curPos = typed.length;
    const wpmColor = wpm >= 60 ? '#22c55e' : wpm >= 30 ? '#f59e0b' : 'var(--c-danger)';
    const accColor = accuracy >= 95 ? '#22c55e' : accuracy >= 80 ? '#f59e0b' : 'var(--c-danger)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Prompt display */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontFamily: 'var(--font-ui)' }}>
                    {prompt.title} — type this exactly
                </div>
                <pre
                    ref={shakeRef}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, position: 'relative' }}
                >
                    {chars.map((ch, i) => {
                        let cls = 'arena-char-untyped';
                        if (i < typed.length) {
                            cls = typed[i] === ch ? 'arena-char-correct' : 'arena-char-incorrect';
                        }
                        return (
                            <span key={i} class={`${cls}${i === curPos ? ' arena-char-cursor' : ''}`}>
                                {ch}
                            </span>
                        );
                    })}
                    {curPos >= chars.length && <span class="arena-char-cursor"> </span>}
                </pre>
            </div>

            {/* Hidden textarea captures input */}
            <textarea
                ref={textareaRef}
                value={typed}
                onInput={handleInput}
                style={{
                    position: 'absolute', opacity: 0, width: 1, height: 1,
                    pointerEvents: 'none', resize: 'none',
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellcheck={false}
            />

            {/* Tap-to-focus overlay when unfocused on mobile */}
            <div
                style={{ position: 'absolute', inset: 0, cursor: 'text' }}
                onClick={() => textareaRef.current?.focus()}
            />

            {/* Stats bar */}
            <div style={{
                flexShrink: 0,
                borderTop: '1px solid var(--c-border)',
                background: 'var(--c-header)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                fontFamily: 'var(--font-ui)',
            }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: wpmColor, lineHeight: 1 }}>{wpm}</span>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>WPM</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: accColor, lineHeight: 1 }}>{accuracy}%</span>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>ACC</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>
                        {Math.min(typed.length, prompt.content.length)}/{prompt.content.length}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>chars</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        class="btn-icon"
                        style={{ fontSize: 12, gap: 4 }}
                        onClick={() => { soloPrompt.value = null; resetSolo(); }}
                        data-tooltip="Change prompt"
                    >
                        <RotateCcw size={12} /> Quit
                    </button>
                </div>
            </div>
        </div>
    );
}

function Stat({ icon, label, value, color }: { icon: preact.ComponentChildren; label: string; value: string; color: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ color: 'var(--c-muted)' }}>{icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-ui)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-ui)' }}>{label}</div>
        </div>
    );
}
