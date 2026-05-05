import { useEffect, useRef, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import {
  arenaWordQueue, arenaGameStartedAt, arenaClaimedWords,
  arenaDestroyedWords, arenaMissedWords, arenaMyPlayer,
  arenaPlayers, arenaPlayerId,
} from '@/store/arena';
import { wordProgress, wordScore } from '@/lib/game-engine';
import { sendMsg } from '@/lib/partykit-client';
import { sfxPop, sfxMiss, sfxCombo, sfxIsMuted, sfxSetMuted } from '@/lib/sfx';

const WAVE_MS = 25_000;
const PARTICLE_COLORS = ['#f7df4b', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899'];

const hudCombo = signal(0);
const hudScore = signal(0);
const hudWave  = signal(1);

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

export function SurvivalGame() {
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

  useEffect(() => {
    const field = fieldRef.current!;
    const words = arenaWordQueue.value;

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

    function onVisibility() {
      if (!document.hidden) inputRef.current?.focus();
    }
    document.addEventListener('visibilitychange', onVisibility);

    let prevWave = 1;

    function tick() {
      const startedAt = arenaGameStartedAt.value;
      if (!startedAt) { rafRef.current = requestAnimationFrame(tick); return; }

      const elapsed   = Date.now() - startedAt;
      const claimed   = arenaClaimedWords.value;
      const destroyed = arenaDestroyedWords.value;
      const missed    = arenaMissedWords.value;
      const fieldH    = field.clientHeight;
      const myId      = arenaPlayerId.value;
      const targetId  = targetIdRef.current;
      const typedPfx  = inputRef.current?.value ?? '';

      const wave = Math.min(Math.floor(elapsed / WAVE_MS) + 1, 9);
      if (wave !== prevWave) { prevWave = wave; hudWave.value = wave; }

      if (targetId && claimed.has(targetId) && claimed.get(targetId) !== myId) {
        targetIdRef.current = null;
        if (inputRef.current) inputRef.current.value = '';
      }

      const playerColors = new Map<string, string>();
      for (const p of arenaPlayers.value) playerColors.set(p.id, p.color);

      for (const word of words) {
        const el = els.get(word.id);
        if (!el) continue;

        if (destroyed.has(word.id)) {
          if (!localDestroyedRef.current.has(word.id)) {
            localDestroyedRef.current.add(word.id);
            el.classList.add('arena-word--destroy');
            const ref = el;
            setTimeout(() => { ref.style.display = 'none'; }, 360);
          }
          continue;
        }

        if (missed.has(word.id)) { el.style.display = 'none'; continue; }

        const p = wordProgress(word, elapsed);
        if (p < 0) { el.style.display = 'none'; continue; }

        if (p >= 1) {
          if (!localMissedRef.current.has(word.id)) {
            localMissedRef.current.add(word.id);
            if (targetIdRef.current === word.id) {
              targetIdRef.current = null;
              if (inputRef.current) inputRef.current.value = '';
            }
            sendMsg({ type: 'word_missed', wordId: word.id });
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

        const claimedBy = claimed.get(word.id);
        if (word.id === targetIdRef.current) {
          el.classList.add('arena-word--mine');
          el.classList.remove('arena-word--theirs');
          el.style.removeProperty('color');
          const n = typedPfx.length;
          el.innerHTML = `<span class="typed-prefix">${word.text.slice(0, n)}</span>${word.text.slice(n)}`;
        } else if (claimedBy && claimedBy !== myId) {
          el.classList.remove('arena-word--mine');
          el.classList.add('arena-word--theirs');
          el.style.color = playerColors.get(claimedBy) ?? 'var(--c-muted)';
          if (el.textContent !== word.text) el.textContent = word.text;
        } else {
          el.classList.remove('arena-word--mine', 'arena-word--theirs');
          el.style.removeProperty('color');
          if (el.textContent !== word.text) el.textContent = word.text;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      els.forEach(el => el.remove());
      wordElsRef.current    = new Map();
      localMissedRef.current   = new Set();
      localDestroyedRef.current = new Set();
      targetIdRef.current   = null;
      comboRef.current      = 0;
      scoreRef.current      = 0;
      hudCombo.value = 0;
      hudScore.value = 0;
      hudWave.value  = 1;
    };
  }, []);

  function handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const typed = input.value;

    if (!typed) { targetIdRef.current = null; return; }

    const elapsed   = Date.now() - (arenaGameStartedAt.value ?? 0);
    const claimed   = arenaClaimedWords.value;
    const destroyed = arenaDestroyedWords.value;
    const missed    = arenaMissedWords.value;
    const myId      = arenaPlayerId.value;
    const words     = arenaWordQueue.value;
    const field     = fieldRef.current!;

    if (targetIdRef.current) {
      const target = words.find(w => w.id === targetIdRef.current);
      if (!target || destroyed.has(target.id) || missed.has(target.id)) {
        targetIdRef.current = null; input.value = ''; return;
      }

      if (typed === target.text) {
        comboRef.current++;
        const pts = wordScore(target, comboRef.current);
        scoreRef.current += pts;
        hudCombo.value = comboRef.current;
        hudScore.value = scoreRef.current;

        // VFX + SFX
        const el = wordElsRef.current.get(target.id);
        if (el) {
          spawnParticles(el, field, 'var(--c-accent)');
          spawnScoreFloat(el, field, pts);
        }
        sfxPop(comboRef.current);
        if (comboRef.current >= 3 && comboRef.current % 1 === 0) sfxCombo(comboRef.current);

        sendMsg({ type: 'word_done', wordId: target.id, combo: comboRef.current });
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

    const candidates = words.filter(w => {
      if (destroyed.has(w.id) || missed.has(w.id)) return false;
      const p = wordProgress(w, elapsed);
      if (p < 0 || p >= 1) return false;
      const claimedBy = claimed.get(w.id);
      if (claimedBy && claimedBy !== myId) return false;
      return w.text.startsWith(typed);
    });
    if (candidates.length > 0) {
      const best = candidates.reduce((a, b) =>
        wordProgress(b, elapsed) > wordProgress(a, elapsed) ? b : a
      );
      targetIdRef.current = best.id;
      sendMsg({ type: 'claim_word', wordId: best.id });
    }
  }

  const myPlayer   = arenaMyPlayer.value;
  const allPlayers = arenaPlayers.value;
  const myId       = arenaPlayerId.value;
  const combo      = hudCombo.value;
  const score      = hudScore.value;
  const wave       = hudWave.value;
  const alive      = myPlayer?.alive ?? true;
  const myHp       = myPlayer?.hp ?? 5;

  useEffect(() => {
    if (myHp < prevHpRef.current) {
      const row = hpRowRef.current;
      if (row) {
        row.classList.remove('arena-hp-row--shake');
        void row.offsetWidth;
        row.classList.add('arena-hp-row--shake');
        setTimeout(() => row.classList.remove('arena-hp-row--shake'), 420);
      }
      if (fieldRef.current) flashDamage(fieldRef.current);
      sfxMiss();
    }
    prevHpRef.current = myHp;
  }, [myHp]);

  const waveProgress = ((Date.now() - (arenaGameStartedAt.value ?? Date.now())) % WAVE_MS) / WAVE_MS;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* HUD */}
      <div class="arena-hud-top">
        <div class="arena-hud-item">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span class="arena-hud-label">Wave</span>
              <span class="arena-hud-value">{wave}<span style={{ color: 'var(--c-muted)', fontSize: 12, fontWeight: 500 }}>/9</span></span>
            </div>
            <div class="arena-wave-bar-track" style={{ width: 80 }}>
              <div class="arena-wave-bar-fill" style={{ width: `${waveProgress * 100}%` }} />
            </div>
          </div>
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

      {/* Field */}
      <div
        ref={fieldRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'text' }}
        onClick={() => inputRef.current?.focus()}
      />

      {/* Bottom bar */}
      <div class="arena-bottom-bar">
        <div ref={hpRowRef} class="arena-hp-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} class={`arena-hp-heart${i >= myHp ? ' arena-hp-heart--lost' : ''}`}>♥</span>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          class="arena-word-input"
          placeholder={alive ? 'Type words…' : ''}
          disabled={!alive}
          onInput={handleInput}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellcheck={false}
        />

        <div class="arena-opponents">
          {allPlayers.filter(p => p.id !== myId).map(p => (
            <div key={p.id} class="arena-opponent">
              <span class="arena-opponent-name" style={{ color: p.color }}>
                {p.name.length > 8 ? p.name.slice(0, 7) + '…' : p.name}
              </span>
              <span class="arena-opponent-hearts">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} class={`arena-hp-heart arena-hp-heart--sm${i >= p.hp ? ' arena-hp-heart--lost' : ''}`}>♥</span>
                ))}
              </span>
              {!p.alive && <span class="arena-opponent-dead">💀</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Death overlay */}
      {!alive && (
        <div class="arena-dead-overlay">
          <div class="arena-dead-skull" style={{ fontSize: '72px', lineHeight: 1 }}>💀</div>
          <div class="arena-dead-title">You Died</div>
          <div class="arena-dead-sub">Watching the survivors…</div>
          <div style={{ marginTop: '8px', fontSize: '26px', fontWeight: 800, color: 'var(--c-accent)', fontFamily: 'var(--font-arena)' }}>
            {score.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-muted)' }}>pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
