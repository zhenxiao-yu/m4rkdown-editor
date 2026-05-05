import { useEffect, useRef } from 'preact/hooks';
import { signal } from '@preact/signals';
import {
  arenaWordQueue, arenaGameStartedAt, arenaClaimedWords,
  arenaDestroyedWords, arenaMissedWords, arenaMyPlayer,
  arenaPlayers, arenaPlayerId,
} from '@/store/arena';
import { wordProgress, wordScore } from '@/lib/game-engine';
import { sendMsg } from '@/lib/partykit-client';

const WAVE_MS = 25_000;

// Module-level HUD signals (reset on component unmount)
const hudCombo = signal(0);
const hudScore = signal(0);
const hudWave  = signal(1);

export function SurvivalGame() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef   = useRef<number>(0);

  const wordElsRef        = useRef<Map<string, HTMLDivElement>>(new Map());
  const targetIdRef       = useRef<string | null>(null);
  const localMissedRef    = useRef<Set<string>>(new Set());
  const localDestroyedRef = useRef<Set<string>>(new Set());
  const comboRef          = useRef(0);
  const scoreRef          = useRef(0);

  useEffect(() => {
    const field = fieldRef.current!;
    const words = arenaWordQueue.value;

    // Build one DOM node per word
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

      // Wave label update
      const wave = Math.min(Math.floor(elapsed / WAVE_MS) + 1, 9);
      if (wave !== prevWave) { prevWave = wave; hudWave.value = wave; }

      // Release target if another player beat us to the claim
      if (targetId && claimed.has(targetId) && claimed.get(targetId) !== myId) {
        targetIdRef.current = null;
        if (inputRef.current) inputRef.current.value = '';
      }

      // Build player color map once per frame (O(n) not O(n*m))
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
            setTimeout(() => { ref.style.display = 'none'; }, 350);
          }
          continue;
        }

        if (missed.has(word.id)) {
          el.style.display = 'none';
          continue;
        }

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

        // Visible — update position
        el.style.display = 'block';
        el.style.transform = `translateY(${p * fieldH}px)`;

        // Urgency class
        if (p > 0.85) {
          el.classList.remove('arena-word--urgent-1');
          el.classList.add('arena-word--urgent-2');
        } else if (p > 0.65) {
          el.classList.remove('arena-word--urgent-2');
          el.classList.add('arena-word--urgent-1');
        } else {
          el.classList.remove('arena-word--urgent-1', 'arena-word--urgent-2');
        }

        // Claimed state + content
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

    if (!typed) {
      targetIdRef.current = null;
      return;
    }

    const elapsed   = Date.now() - (arenaGameStartedAt.value ?? 0);
    const claimed   = arenaClaimedWords.value;
    const destroyed = arenaDestroyedWords.value;
    const missed    = arenaMissedWords.value;
    const myId      = arenaPlayerId.value;
    const words     = arenaWordQueue.value;

    if (targetIdRef.current) {
      const target = words.find(w => w.id === targetIdRef.current);
      if (!target || destroyed.has(target.id) || missed.has(target.id)) {
        targetIdRef.current = null;
        input.value = '';
        return;
      }

      if (typed === target.text) {
        comboRef.current++;
        scoreRef.current += wordScore(target, comboRef.current);
        hudCombo.value = comboRef.current;
        hudScore.value = scoreRef.current;
        sendMsg({ type: 'word_done', wordId: target.id, combo: comboRef.current });
        targetIdRef.current = null;
        input.value = '';
        return;
      }

      if (!target.text.startsWith(typed)) {
        // Block wrong key — revert to longest correct prefix
        let correct = '';
        for (let i = 0; i < typed.length; i++) {
          if (i >= target.text.length || typed[i] !== target.text[i]) break;
          correct += typed[i];
        }
        input.value = correct;
        return;
      }
      return; // still typing correctly
    }

    // No target — scan for first matching visible unclaimed word
    for (const word of words) {
      if (destroyed.has(word.id) || missed.has(word.id)) continue;
      const p = wordProgress(word, elapsed);
      if (p < 0 || p >= 1) continue;
      const claimedBy = claimed.get(word.id);
      if (claimedBy && claimedBy !== myId) continue;
      if (word.text.startsWith(typed)) {
        targetIdRef.current = word.id;
        sendMsg({ type: 'claim_word', wordId: word.id });
        return;
      }
    }
  }

  // Reactive HUD (re-renders infrequently — only on score/HP/death events)
  const myPlayer   = arenaMyPlayer.value;
  const allPlayers = arenaPlayers.value;
  const myId       = arenaPlayerId.value;
  const combo      = hudCombo.value;
  const score      = hudScore.value;
  const wave       = hudWave.value;
  const alive      = myPlayer?.alive ?? true;
  const myHp       = myPlayer?.hp ?? 5;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top HUD strip */}
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

      {/* Play field — words injected by RAF */}
      <div
        ref={fieldRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'text' }}
        onClick={() => inputRef.current?.focus()}
      />

      {/* Bottom bar: HP + input + opponents */}
      <div class="arena-bottom-bar">
        <div class="arena-hp-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} class={`arena-hp-heart${i >= myHp ? ' arena-hp-heart--lost' : ''}`}>♥</span>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          class="arena-word-input"
          placeholder={alive ? 'Type words to destroy them…' : ''}
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
          <div style={{ fontSize: '64px', lineHeight: 1 }}>💀</div>
          <div class="arena-dead-title">You Died</div>
          <div class="arena-dead-sub">Watching the survivors…</div>
          <div style={{ marginTop: '12px', fontSize: '22px', fontWeight: 800, color: 'var(--c-accent)' }}>
            {score.toLocaleString()} pts
          </div>
        </div>
      )}
    </div>
  );
}
