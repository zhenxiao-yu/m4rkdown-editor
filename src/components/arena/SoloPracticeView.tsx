import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { generateWordQueue, wordProgress, wordScore, type Difficulty } from '@/lib/game-engine';
import type { WordDef } from '@/lib/game-engine';
import { sfxPop, sfxMiss, sfxCombo, sfxCountdown, sfxGo, sfxSetMuted, sfxIsMuted } from '@/lib/sfx';
import { recordGame, recordDailyScore, ACHIEVEMENTS, playerLevel, playerStats, dailyChallengeSeed, todayStr, hasDailyChallengeToday } from '@/store/arena-stats';
import { arenaPlayerName } from '@/store/arena';
import { customWordList, clearCustomWords } from '@/store/custom-words';
import { showToast } from '@/store/toast';
import { WordImportModal } from './WordImportModal';

const PARTICLE_COLORS = ['#f7df4b', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'];

function spawnParticles(el: HTMLDivElement, field: HTMLDivElement, color: string) {
  const er = el.getBoundingClientRect();
  const fr = field.getBoundingClientRect();
  const cx = er.left - fr.left + er.width / 2;
  const cy = er.top  - fr.top  + er.height / 2;
  const count = 7;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'arena-particle';
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist  = 28 + Math.random() * 24;
    p.style.left = `${cx}px`;
    p.style.top  = `${cy}px`;
    p.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length] ?? color;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    p.style.animationDuration = `${0.4 + Math.random() * 0.2}s`;
    field.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }
}

function spawnScoreFloat(el: HTMLDivElement, field: HTMLDivElement, pts: number) {
  const er = el.getBoundingClientRect();
  const fr = field.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'arena-score-float';
  f.textContent = `+${pts}`;
  f.style.left = `${er.left - fr.left + er.width / 2}px`;
  f.style.top  = `${er.top  - fr.top}px`;
  field.appendChild(f);
  setTimeout(() => f.remove(), 800);
}

function flashDamage(field: HTMLDivElement) {
  const f = document.createElement('div');
  f.className = 'arena-damage-flash';
  field.appendChild(f);
  setTimeout(() => f.remove(), 500);
}

function wpmColor(w: number) { return w > 60 ? '#22c55e' : w > 30 ? '#f59e0b' : '#ef4444'; }
function accColor(a: number) { return a >= 95 ? '#22c55e' : a >= 80 ? '#f59e0b' : '#ef4444'; }

// ── Solo game signals (persist across re-renders, reset on new game) ──
type SoloState = 'idle' | 'countdown' | 'playing' | 'dead' | 'survived';

const soloIsDailyChallenge = signal<boolean>(false);
const soloDifficulty = signal<Difficulty>('normal');

const soloState      = signal<SoloState>('idle');
const soloCountdown  = signal(3);
const soloHp         = signal(5);
const soloScore      = signal(0);
const soloCombo      = signal(0);
const soloWords      = signal<WordDef[]>([]);
const soloWordsTyped = signal(0);
const soloStartedAt  = signal<number | null>(null);

// HUD live signals
const soloHudWave     = signal(1);
const soloHudCombo    = signal(0);
const soloHudScore    = signal(0);
const soloHudWpm      = signal(0);
const soloHudAccuracy = signal(100);

// Final values captured at game-end for GameOverScreen
const soloFinalWpm      = signal(0);
const soloFinalAccuracy = signal(100);

function resetSolo() {
  soloState.value      = 'idle';
  soloCountdown.value  = 3;
  soloHp.value         = 5;
  soloScore.value      = 0;
  soloCombo.value      = 0;
  soloWords.value      = [];
  soloWordsTyped.value = 0;
  soloStartedAt.value  = null;
  soloHudWpm.value     = 0;
  soloHudAccuracy.value = 100;
  soloFinalWpm.value   = 0;
  soloFinalAccuracy.value = 100;
}

function startNewGame(daily = false) {
  const seed = daily ? dailyChallengeSeed() : Math.floor(Math.random() * 0xFFFFFF);
  soloIsDailyChallenge.value = daily;
  soloWords.value      = generateWordQueue(seed, daily ? undefined : (customWordList.value ?? undefined), soloDifficulty.value);
  soloHp.value         = 5;
  soloScore.value      = 0;
  soloCombo.value      = 0;
  soloWordsTyped.value = 0;
  soloStartedAt.value  = null;
  soloCountdown.value  = 3;
  soloHudWave.value    = 1;
  soloHudCombo.value   = 0;
  soloHudScore.value   = 0;
  soloHudWpm.value     = 0;
  soloHudAccuracy.value = 100;
  soloState.value      = 'countdown';
}

// ── Solo Practice View ────────────────────────────────────────────────

export function SoloPracticeView() {
  const state = soloState.value;

  if (state === 'idle')      return <IdleScreen />;
  if (state === 'countdown') return <CountdownScreen />;
  if (state === 'dead' || state === 'survived') return <GameOverScreen />;
  return <GameScreen />;
}

// ── Idle / start screen ───────────────────────────────────────────────

function IdleScreen() {
  const [showImport, setShowImport] = useState(false);
  const customWords = customWordList.value;
  const stats = playerStats.value;
  const dailyDone = hasDailyChallengeToday();
  const todayDate = todayStr();

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40, textAlign: 'center', overflowY: 'auto' }}>
        <div style={{ fontSize: 48 }}>⚡</div>
        <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--c-accent)', fontFamily: 'var(--font-ui)' }}>Solo Survival</div>
        <div style={{ fontSize: 14, color: 'var(--c-text-2)', maxWidth: 360, lineHeight: 1.6, fontFamily: 'var(--font-ui)' }}>
          Words fall from the sky. Type them before they hit the ground.<br />
          Miss 5 and it's game over. Survive 8 minutes to win!
        </div>

        {/* Daily Challenge card */}
        <div style={{
          width: '100%', maxWidth: 340,
          border: '1px solid var(--c-accent)',
          borderRadius: 10,
          padding: '14px 18px',
          background: 'color-mix(in srgb, var(--c-accent) 8%, var(--c-surface))',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-ui)' }}>Daily Challenge</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'var(--font-ui)' }}>{todayDate} · same words for everyone</div>
              </div>
            </div>
            {dailyDone && (
              <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>✓ Done</span>
            )}
          </div>
          {dailyDone && stats.dailyChallengeDate === todayDate && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--c-muted)', fontFamily: 'var(--font-ui)', marginBottom: 8 }}>
              <span>Best score: <b style={{ color: 'var(--c-accent)' }}>{stats.dailyBestScore}</b></span>
              <span>WPM: <b style={{ color: '#22c55e' }}>{stats.dailyBestWpm}</b></span>
            </div>
          )}
          <button
            class="arena-btn-primary"
            style={{ width: '100%' }}
            onClick={() => startNewGame(true)}
          >
            {dailyDone ? '↺ Replay Daily' : '▶ Play Daily Challenge'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          <div class="arena-idle-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <InfoChip icon="🌊" label="9 Waves" sub="25s each" />
            <InfoChip icon="💀" label="5 Lives" sub="miss = -1 HP" />
            <InfoChip icon="⚡" label="Combo" sub="streak bonus" />
            <InfoChip icon="⏱" label="8 min" sub="max duration" />
          </div>
          {/* Difficulty */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {(['easy','normal','hard','expert'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => { soloDifficulty.value = d; }}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  fontSize: 11,
                  fontFamily: 'var(--font-ui)',
                  fontWeight: soloDifficulty.value === d ? 800 : 400,
                  border: `1px solid ${soloDifficulty.value === d ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  borderRadius: 6,
                  background: soloDifficulty.value === d ? 'color-mix(in srgb, var(--c-accent) 15%, var(--c-surface))' : 'var(--c-btn)',
                  color: soloDifficulty.value === d ? 'var(--c-accent)' : 'var(--c-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.12s',
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button class="arena-btn-primary" style={{ flex: 1, background: 'var(--c-btn)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }} onClick={() => startNewGame(false)}>
              ▶ Free Practice
            </button>
            <button
              class="btn-icon"
              title="Import custom words"
              aria-label="Import custom words"
              onClick={() => setShowImport(true)}
              style={{ flexShrink: 0, padding: '6px 12px' }}
            >
              📁
            </button>
          </div>
          {customWords ? (
            <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✓ {customWords.length} custom words active
              <button
                onClick={clearCustomWords}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: 0 }}
              >
                clear
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {showImport && <WordImportModal onClose={() => setShowImport(false)} />}
    </>
  );
}

function InfoChip({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface-alt)', textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{sub}</div>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────

function CountdownScreen() {
  const count = soloCountdown.value;

  useEffect(() => {
    if (count > 0) sfxCountdown(count);
    else sfxGo();
  }, [count]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;

    function startInterval() {
      t = setInterval(() => {
        const next = soloCountdown.value - 1;
        if (next <= 0) {
          clearInterval(t);
          soloStartedAt.value = Date.now();
          soloState.value = 'playing';
        } else {
          soloCountdown.value = next;
        }
      }, 1000);
    }

    function onVisibility() {
      if (document.hidden) {
        clearInterval(t);
      } else {
        startInterval();
      }
    }

    startInterval();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const countColor = count === 3 ? '#dc2626' : count === 2 ? '#d97706' : '#16a34a';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, background: `${countColor}18` }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)' }}>Get Ready…</div>
      <div
        key={count}
        class="arena-countdown-number"
        style={{ fontSize: 120, fontWeight: 900, color: countColor, lineHeight: 1, textShadow: `0 0 40px ${countColor}88`, userSelect: 'none' }}
      >
        {count}
      </div>
    </div>
  );
}

// ── Active Game ───────────────────────────────────────────────────────

const WAVE_MS = 25_000;

function GameScreen() {
  const [muted, setMuted] = useState(sfxIsMuted());
  function toggleMute() { const n = !muted; sfxSetMuted(n); setMuted(n); }

  const fieldRef  = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const hpRowRef  = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const prevHpRef = useRef(5);

  const wordElsRef        = useRef<Map<string, HTMLDivElement>>(new Map());
  const targetIdRef       = useRef<string | null>(null);
  const localMissedRef    = useRef<Set<string>>(new Set());
  const localDestroyedRef = useRef<Set<string>>(new Set());
  const comboRef          = useRef(0);
  const scoreRef          = useRef(0);
  const hpRef             = useRef(5);
  const wordsTypedRef     = useRef(0);
  const charsTypedRef     = useRef(0);
  const wpmTimerRef       = useRef(0);

  useEffect(() => {
    const field = fieldRef.current!;
    const words = soloWords.value;

    // Reset local refs
    comboRef.current       = 0;
    scoreRef.current       = 0;
    hpRef.current          = 5;
    wordsTypedRef.current  = 0;
    charsTypedRef.current  = 0;
    wpmTimerRef.current    = 0;
    soloHudWave.value      = 1;
    soloHudCombo.value     = 0;
    soloHudScore.value     = 0;
    soloHudWpm.value       = 0;
    soloHudAccuracy.value  = 100;

    // Build word DOM nodes
    const els = new Map<string, HTMLDivElement>();
    for (const word of words) {
      const el = document.createElement('div');
      el.className = 'arena-word';
      el.style.left = `${word.lane}%`;
      el.style.display = 'none';
      el.textContent = word.text;
      field.appendChild(el);
      els.set(word.id, el);
    }
    wordElsRef.current = els;
    inputRef.current?.focus();

    let prevWave = 1;
    const localMissed    = localMissedRef.current;
    const localDestroyed = localDestroyedRef.current;

    // Pause/resume when tab is hidden
    let pausedAt: number | null = null;
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        pausedAt = Date.now();
      } else {
        if (pausedAt !== null && soloStartedAt.value !== null) {
          soloStartedAt.value = soloStartedAt.value + (Date.now() - pausedAt);
          pausedAt = null;
        }
        inputRef.current?.focus();
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    function tick() {
      const startedAt = soloStartedAt.value;
      if (!startedAt) { rafRef.current = requestAnimationFrame(tick); return; }

      const elapsed = Date.now() - startedAt;
      const fieldH  = field.clientHeight;
      const targetId = targetIdRef.current;
      const typedPfx = inputRef.current?.value ?? '';

      // Wave
      const wave = Math.min(Math.floor(elapsed / WAVE_MS) + 1, 9);
      if (wave !== prevWave) { prevWave = wave; soloHudWave.value = wave; }

      // WPM + accuracy (throttled to every 250ms)
      if (elapsed - wpmTimerRef.current >= 250) {
        wpmTimerRef.current = elapsed;
        const mins = elapsed / 60000;
        soloHudWpm.value = mins > 0.05 ? Math.round((charsTypedRef.current / 5) / mins) : 0;
        const d = localDestroyed.size;
        const m = localMissed.size;
        soloHudAccuracy.value = (d + m) > 0 ? Math.round(d / (d + m) * 100) : 100;
      }

      for (const word of words) {
        const el = els.get(word.id);
        if (!el) continue;

        if (localDestroyed.has(word.id)) {
          continue;
        }

        if (localMissed.has(word.id)) {
          el.style.display = 'none';
          continue;
        }

        const p = wordProgress(word, elapsed);

        if (p < 0) { el.style.display = 'none'; continue; }

        if (p >= 1) {
          if (!localMissed.has(word.id)) {
            localMissed.add(word.id);
            if (targetIdRef.current === word.id) {
              targetIdRef.current = null;
              if (inputRef.current) inputRef.current.value = '';
            }
            hpRef.current = Math.max(0, hpRef.current - 1);
            soloHp.value = hpRef.current;
            soloCombo.value = 0;
            comboRef.current = 0;
            soloHudCombo.value = 0;
            if (fieldRef.current) flashDamage(fieldRef.current);
            if (hpRef.current === 0) {
              soloWordsTyped.value = wordsTypedRef.current;
              soloScore.value = scoreRef.current;
              soloFinalWpm.value = soloHudWpm.value;
              soloFinalAccuracy.value = soloHudAccuracy.value;
              soloState.value = 'dead';
              cancelAnimationFrame(rafRef.current);
              return;
            }
          }
          el.style.display = 'none';
          continue;
        }

        el.style.display = 'block';
        el.style.transform = `translateY(${p * fieldH}px)`;

        if (p > 0.85) {
          el.classList.remove('arena-word--urgent-1');
          el.classList.add('arena-word--urgent-2');
        } else if (p > 0.65) {
          el.classList.remove('arena-word--urgent-2');
          el.classList.add('arena-word--urgent-1');
        } else {
          el.classList.remove('arena-word--urgent-1', 'arena-word--urgent-2');
        }

        if (word.id === targetId) {
          el.classList.add('arena-word--mine');
          const n = typedPfx.length;
          el.innerHTML = `<span class="typed-prefix">${word.text.slice(0, n)}</span>${word.text.slice(n)}`;
        } else {
          el.classList.remove('arena-word--mine');
          if (el.textContent !== word.text) el.textContent = word.text;
        }
      }

      // Check if all words done (8-min game completed)
      const allDone = words.every(w => localMissed.has(w.id) || localDestroyed.has(w.id));
      if (allDone) {
        soloWordsTyped.value = wordsTypedRef.current;
        soloScore.value = scoreRef.current;
        soloFinalWpm.value = soloHudWpm.value;
        soloFinalAccuracy.value = soloHudAccuracy.value;
        soloState.value = 'survived';
        cancelAnimationFrame(rafRef.current);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      els.forEach(el => el.remove());
      wordElsRef.current       = new Map();
      localMissedRef.current   = new Set();
      localDestroyedRef.current = new Set();
      targetIdRef.current      = null;
    };
  }, []);

  function handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const typed = input.value;

    if (!typed) { targetIdRef.current = null; return; }

    const elapsed        = Date.now() - (soloStartedAt.value ?? 0);
    const words          = soloWords.value;
    const localMissed    = localMissedRef.current;
    const localDestroyed = localDestroyedRef.current;

    if (targetIdRef.current) {
      const target = words.find(w => w.id === targetIdRef.current);
      if (!target || localDestroyed.has(target.id) || localMissed.has(target.id)) {
        targetIdRef.current = null; input.value = ''; return;
      }

      if (typed === target.text) {
        localDestroyedRef.current.add(target.id);
        charsTypedRef.current += target.text.length;
        comboRef.current++;
        const pts = wordScore(target, comboRef.current);
        scoreRef.current += pts;
        wordsTypedRef.current++;
        soloHudCombo.value = comboRef.current;
        soloHudScore.value = scoreRef.current;
        soloCombo.value    = comboRef.current;

        const el = wordElsRef.current.get(target.id);
        if (el && fieldRef.current) {
          spawnParticles(el, fieldRef.current, 'var(--c-accent)');
          spawnScoreFloat(el, fieldRef.current, pts);
          el.classList.add('arena-word--destroy');
          const ref = el;
          setTimeout(() => { ref.style.display = 'none'; }, 350);
        }
        sfxPop(comboRef.current);
        if (comboRef.current >= 3) sfxCombo(comboRef.current);

        targetIdRef.current = null;
        input.value = '';
        return;
      }

      if (!target.text.startsWith(typed)) {
        let correct = '';
        for (let i = 0; i < typed.length; i++) {
          if (i >= target.text.length || typed[i] !== target.text[i]) break;
          correct += typed[i];
        }
        input.value = correct;
        return;
      }
      return;
    }

    // Find matching word — pick the most urgent (highest p, closest to bottom)
    const candidates = words.filter(word => {
      if (localMissed.has(word.id) || localDestroyedRef.current.has(word.id)) return false;
      const p = wordProgress(word, elapsed);
      if (p < 0 || p >= 1) return false;
      return word.text.startsWith(typed);
    });
    if (candidates.length > 0) {
      const best = candidates.reduce((a, b) =>
        wordProgress(b, elapsed) > wordProgress(a, elapsed) ? b : a
      );
      targetIdRef.current = best.id;
    }
  }

  const hp       = soloHp.value;
  const wave     = soloHudWave.value;
  const combo    = soloHudCombo.value;
  const score    = soloHudScore.value;
  const wpm      = soloHudWpm.value;
  const accuracy = soloHudAccuracy.value;

  // Shake HP row + SFX on HP loss
  useEffect(() => {
    if (hp < prevHpRef.current) {
      const row = hpRowRef.current;
      if (row) {
        row.classList.remove('arena-hp-row--shake');
        void row.offsetWidth;
        row.classList.add('arena-hp-row--shake');
        setTimeout(() => row.classList.remove('arena-hp-row--shake'), 450);
      }
      sfxMiss();
    }
    prevHpRef.current = hp;
  }, [hp]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div class="arena-hud-top">
        <div class="arena-hud-item">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span class="arena-hud-label">Wave</span>
              <span class="arena-hud-value">{wave}<span style={{ color: 'var(--c-muted)', fontSize: 12, fontWeight: 500 }}>/9</span></span>
            </div>
            <div class="arena-wave-bar-track" style={{ width: 80 }}>
              <div class="arena-wave-bar-fill" style={{ width: `${((Date.now() - (soloStartedAt.value ?? Date.now())) % WAVE_MS) / WAVE_MS * 100}%` }} />
            </div>
          </div>
        </div>

        <div class="arena-hud-item">
          <span class="arena-hud-value" style={{ color: wpmColor(wpm) }}>{wpm}</span>
          <span class="arena-hud-label">WPM</span>
        </div>

        <div class="arena-hud-item">
          <span class="arena-hud-value" style={{ color: accColor(accuracy) }}>{accuracy}%</span>
          <span class="arena-hud-label">ACC</span>
        </div>

        <div class="arena-hud-item" style={{ marginLeft: 'auto' }}>
          <span class="arena-hud-value" style={{ color: 'var(--c-accent)', fontSize: '22px' }}>
            {score.toLocaleString()}
          </span>
          <span class="arena-hud-label">pts</span>
        </div>
        {combo >= 3 && (
          <div key={combo} class="arena-hud-combo">×{combo} COMBO</div>
        )}
        <button
          onClick={toggleMute}
          style={{ marginLeft: '8px', background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: 'var(--c-muted)', fontSize: 15, lineHeight: 1, flexShrink: 0 }}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div
        ref={fieldRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'text' }}
        onClick={() => inputRef.current?.focus()}
      />

      <div class="arena-bottom-bar">
        <div ref={hpRowRef} class="arena-hp-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} class={`arena-hp-heart${i >= hp ? ' arena-hp-heart--lost' : ''}`}>♥</span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          class="arena-word-input"
          placeholder="Type words to destroy them…"
          onInput={handleInput}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellcheck={false}
        />
        <div class="arena-opponents" style={{ minWidth: 80 }}>
          <div style={{ fontSize: 11, color: 'var(--c-muted)', textAlign: 'right', fontFamily: 'var(--font-ui)' }}>Solo Mode</div>
        </div>
      </div>
    </div>
  );
}

// ── Game Over / Survived ──────────────────────────────────────────────

function GameOverScreen() {
  const survived   = soloState.value === 'survived';
  const score      = soloScore.value;
  const wordsTyped = soloWordsTyped.value;
  const combo      = soloCombo.value;
  const wpm        = soloFinalWpm.value;
  const accuracy   = soloFinalAccuracy.value;

  // Wire XP + achievement toasts (runs once on mount)
  useEffect(() => {
    const prevLevel = playerLevel.value;
    const newAchievements = recordGame({
      wpm,
      accuracy,
      score,
      isWin: survived,
      promptId: soloIsDailyChallenge.value ? `daily-${todayStr()}` : 'solo',
    });
    if (soloIsDailyChallenge.value) {
      const name = arenaPlayerName.value || 'Anonymous';
      recordDailyScore(name, wpm, score, accuracy);
      if (!newAchievements.includes('daily')) {
        const daily = ACHIEVEMENTS.find(a => a.id === 'daily');
        if (daily) showToast(`${daily.icon} Daily Challenge complete!`, 'success', 3000);
      }
    }
    const didLevelUp = playerLevel.value !== prevLevel;
    const toastDelay = didLevelUp ? 2400 : 0;
    newAchievements.forEach((id, i) => {
      const a = ACHIEVEMENTS.find(a => a.id === id);
      if (a) setTimeout(() => showToast(`${a.icon} ${a.title} unlocked!`, 'success', 4000), toastDelay + i * 400);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 56 }}>{survived ? '🏆' : '💀'}</div>
      <div style={{ fontWeight: 800, fontSize: 26, color: survived ? 'var(--c-accent)' : '#ef4444', fontFamily: 'var(--font-ui)' }}>
        {survived ? 'You Survived!' : 'Game Over'}
      </div>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Stat label="Score"      value={score.toLocaleString()}  color="var(--c-accent)" />
        <Stat label="Words"      value={String(wordsTyped)}      color="var(--c-text)" />
        <Stat label="Best Combo" value={`×${combo}`}             color="#f59e0b" />
        <Stat label="WPM"        value={String(wpm)}             color={wpmColor(wpm)} />
        <Stat label="Accuracy"   value={`${accuracy}%`}          color={accColor(accuracy)} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button class="arena-btn-primary" onClick={() => startNewGame(soloIsDailyChallenge.value)}>▶ Play Again</button>
        <button class="btn-icon" style={{ padding: '10px 20px', fontSize: 14 }} onClick={resetSolo}>
          ← Back
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-ui)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}
