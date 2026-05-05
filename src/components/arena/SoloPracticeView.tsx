import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { generateWordQueue, wordProgress, wordScore } from '@/lib/game-engine';
import type { WordDef } from '@/lib/game-engine';

// ── Solo game signals (persist across re-renders, reset on new game) ──
type SoloState = 'idle' | 'countdown' | 'playing' | 'dead' | 'survived';

const soloState     = signal<SoloState>('idle');
const soloCountdown = signal(3);
const soloHp        = signal(5);
const soloScore     = signal(0);
const soloCombo     = signal(0);
const soloWords     = signal<WordDef[]>([]);
const soloWordsTyped = signal(0);
const soloStartedAt = signal<number | null>(null);

function resetSolo() {
  soloState.value     = 'idle';
  soloCountdown.value = 3;
  soloHp.value        = 5;
  soloScore.value     = 0;
  soloCombo.value     = 0;
  soloWords.value     = [];
  soloWordsTyped.value = 0;
  soloStartedAt.value = null;
}

function startNewGame() {
  const seed = Math.floor(Math.random() * 0xFFFFFF);
  soloWords.value = generateWordQueue(seed);
  soloHp.value    = 5;
  soloScore.value = 0;
  soloCombo.value = 0;
  soloWordsTyped.value = 0;
  soloStartedAt.value  = null;
  soloCountdown.value  = 3;
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>⚡</div>
      <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--c-accent)', fontFamily: 'var(--font-ui)' }}>Solo Survival</div>
      <div style={{ fontSize: 14, color: 'var(--c-text-2)', maxWidth: 360, lineHeight: 1.6, fontFamily: 'var(--font-ui)' }}>
        Words fall from the sky. Type them before they hit the ground.<br />
        Miss 5 and it's game over. Survive 8 minutes to win!
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <InfoChip icon="🌊" label="9 Waves" sub="25s each" />
          <InfoChip icon="💀" label="5 Lives" sub="miss = -1 HP" />
          <InfoChip icon="⚡" label="Combo" sub="streak bonus" />
          <InfoChip icon="⏱" label="8 min" sub="max duration" />
        </div>
        <button class="arena-btn-primary" style={{ marginTop: 8 }} onClick={startNewGame}>
          ▶ Start Practice
        </button>
      </div>
    </div>
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
    const t = setInterval(() => {
      const next = soloCountdown.value - 1;
      if (next <= 0) {
        clearInterval(t);
        soloStartedAt.value = Date.now();
        soloState.value = 'playing';
      } else {
        soloCountdown.value = next;
      }
    }, 1000);
    return () => clearInterval(t);
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

// Module-level HUD signals (reset on each game)
const soloHudWave  = signal(1);
const soloHudCombo = signal(0);
const soloHudScore = signal(0);

function GameScreen() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef   = useRef<number>(0);

  const wordElsRef        = useRef<Map<string, HTMLDivElement>>(new Map());
  const targetIdRef       = useRef<string | null>(null);
  const localMissedRef    = useRef<Set<string>>(new Set());
  const localDestroyedRef = useRef<Set<string>>(new Set());
  const comboRef          = useRef(0);
  const scoreRef          = useRef(0);
  const hpRef             = useRef(5);
  const wordsTypedRef     = useRef(0);

  useEffect(() => {
    const field = fieldRef.current!;
    const words = soloWords.value;

    // Reset local refs
    comboRef.current      = 0;
    scoreRef.current      = 0;
    hpRef.current         = 5;
    wordsTypedRef.current = 0;
    soloHudWave.value     = 1;
    soloHudCombo.value    = 0;
    soloHudScore.value    = 0;

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

      for (const word of words) {
        const el = els.get(word.id);
        if (!el) continue;

        if (localDestroyed.has(word.id)) {
          continue; // already animated
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
            // Lose HP
            hpRef.current = Math.max(0, hpRef.current - 1);
            soloHp.value = hpRef.current;
            soloCombo.value = 0;
            comboRef.current = 0;
            soloHudCombo.value = 0;
            if (hpRef.current === 0) {
              soloWordsTyped.value = wordsTypedRef.current;
              soloScore.value = scoreRef.current;
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

        // Urgency
        if (p > 0.85) {
          el.classList.remove('arena-word--urgent-1');
          el.classList.add('arena-word--urgent-2');
        } else if (p > 0.65) {
          el.classList.remove('arena-word--urgent-2');
          el.classList.add('arena-word--urgent-1');
        } else {
          el.classList.remove('arena-word--urgent-1', 'arena-word--urgent-2');
        }

        // Target word shows typed prefix
        if (word.id === targetId) {
          el.classList.add('arena-word--mine');
          const n = typedPfx.length;
          el.innerHTML = `<span class="typed-prefix">${word.text.slice(0, n)}</span>${word.text.slice(n)}`;
        } else {
          el.classList.remove('arena-word--mine');
          if (el.textContent !== word.text) el.textContent = word.text;
        }
      }

      // Check if all words are done (8-min game completed)
      const allDone = words.every(w => localMissed.has(w.id) || localDestroyed.has(w.id));
      if (allDone) {
        soloWordsTyped.value = wordsTypedRef.current;
        soloScore.value = scoreRef.current;
        soloState.value = 'survived';
        cancelAnimationFrame(rafRef.current);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      els.forEach(el => el.remove());
      wordElsRef.current    = new Map();
      localMissedRef.current   = new Set();
      localDestroyedRef.current = new Set();
      targetIdRef.current   = null;
    };
  }, []);

  function handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const typed = input.value;

    if (!typed) { targetIdRef.current = null; return; }

    const elapsed   = Date.now() - (soloStartedAt.value ?? 0);
    const words     = soloWords.value;
    const localMissed    = localMissedRef.current;
    const localDestroyed = localDestroyedRef.current;

    if (targetIdRef.current) {
      const target = words.find(w => w.id === targetIdRef.current);
      if (!target || localDestroyed.has(target.id) || localMissed.has(target.id)) {
        targetIdRef.current = null; input.value = ''; return;
      }

      if (typed === target.text) {
        // Destroy word
        localDestroyedRef.current.add(target.id);
        const el = wordElsRef.current.get(target.id);
        if (el) {
          el.classList.add('arena-word--destroy');
          const ref = el;
          setTimeout(() => { ref.style.display = 'none'; }, 350);
        }
        comboRef.current++;
        scoreRef.current += wordScore(target, comboRef.current);
        wordsTypedRef.current++;
        soloHudCombo.value = comboRef.current;
        soloHudScore.value = scoreRef.current;
        soloCombo.value    = comboRef.current;
        targetIdRef.current = null;
        input.value = '';
        return;
      }

      if (!target.text.startsWith(typed)) {
        // Block wrong key
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

    // Find matching word
    for (const word of words) {
      if (localMissed.has(word.id) || localDestroyedRef.current.has(word.id)) continue;
      const p = wordProgress(word, elapsed);
      if (p < 0 || p >= 1) continue;
      if (word.text.startsWith(typed)) {
        targetIdRef.current = word.id;
        return;
      }
    }
  }

  const hp    = soloHp.value;
  const wave  = soloHudWave.value;
  const combo = soloHudCombo.value;
  const score = soloHudScore.value;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div class="arena-hud-top">
        <div class="arena-hud-item">
          <span class="arena-hud-label">Wave</span>
          <span class="arena-hud-value">{wave}/9</span>
        </div>
        <div class="arena-hud-item">
          <span class="arena-hud-value" style={{ color: 'var(--c-accent)', fontSize: '20px', fontWeight: 800 }}>
            {score.toLocaleString()}
          </span>
          <span class="arena-hud-label">pts</span>
        </div>
        {combo >= 3 && (
          <div key={combo} class="arena-hud-combo">×{combo} combo</div>
        )}
      </div>

      <div
        ref={fieldRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'text' }}
        onClick={() => inputRef.current?.focus()}
      />

      <div class="arena-bottom-bar">
        <div class="arena-hp-row">
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
  const survived    = soloState.value === 'survived';
  const score       = soloScore.value;
  const wordsTyped  = soloWordsTyped.value;
  const combo       = soloCombo.value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 56 }}>{survived ? '🏆' : '💀'}</div>
      <div style={{ fontWeight: 800, fontSize: 26, color: survived ? 'var(--c-accent)' : '#ef4444', fontFamily: 'var(--font-ui)' }}>
        {survived ? 'You Survived!' : 'Game Over'}
      </div>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Stat label="Score"       value={score.toLocaleString()}  color="var(--c-accent)" />
        <Stat label="Words"       value={String(wordsTyped)}      color="var(--c-text)" />
        <Stat label="Best Combo"  value={`×${combo}`}             color="#f59e0b" />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button class="arena-btn-primary" onClick={startNewGame}>▶ Play Again</button>
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
