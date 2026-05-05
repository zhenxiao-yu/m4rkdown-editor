import { useEffect, useRef, useState } from 'preact/hooks';
import confetti from 'canvas-confetti';
import {
  arenaFinalPlayers, arenaSurvivorId, arenaPlayerId,
  arenaRoomId, arenaPlayerName, arenaIsHost, arenaPlayerColor,
  arenaGameStartedAt, closeArena,
} from '@/store/arena';
import { connectToRoom, sendMsg } from '@/lib/partykit-client';
import type { SurvivalPlayer } from '@/lib/arena-types';
import { sfxWin, sfxDead } from '@/lib/sfx';
import { recordGame, ACHIEVEMENTS, playerLevel } from '@/store/arena-stats';
import { showToast } from '@/store/toast';

const MEDAL = ['👑', '🥈', '🥉'];
const PODIUM_HEIGHTS = ['130px', '100px', '75px'];
const PODIUM_COLORS  = ['#f7df4b', '#9ca3af', '#cd7f32'];

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let raf: number;
    function step(now: number) {
      const ease = 1 - Math.pow(1 - Math.min((now - start) / duration, 1), 3);
      setValue(Math.round(ease * target));
      if (ease < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}

function rankPlayers(players: SurvivalPlayer[], survivorId: string | null): (SurvivalPlayer & { rank: number })[] {
  return [...players]
    .sort((a, b) => {
      // Survivor (null deathOrder) is rank 1
      if (a.id === survivorId) return -1;
      if (b.id === survivorId) return 1;
      // Higher deathOrder = died later = better rank
      const ao = a.deathOrder ?? Infinity;
      const bo = b.deathOrder ?? Infinity;
      return bo - ao;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export function ResultsView() {
  const players    = arenaFinalPlayers.value;
  const survivorId = arenaSurvivorId.value;
  const myId       = arenaPlayerId.value;
  const roomId     = arenaRoomId.value;
  const myName     = arenaPlayerName.value;
  const isHost     = arenaIsHost.value;

  const ranked = rankPlayers(players, survivorId);
  const me     = ranked.find(p => p.id === myId);
  const top3   = ranked.slice(0, 3);
  const rest   = ranked.slice(3);

  const myScore = useCountUp(me?.score ?? 0);
  const isSurvivor = me?.id === survivorId;
  const recordedRef = useRef(false);

  useEffect(() => {
    if (isSurvivor) {
      sfxWin();
      const end = Date.now() + 2500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0 },   colors: ['#f7df4b', '#22c55e', '#3b82f6'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 },   colors: ['#ec4899', '#a855f7', '#f97316'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    } else {
      sfxDead();
    }
  }, []);

  // Wire XP + achievement toasts (runs once)
  useEffect(() => {
    if (recordedRef.current || !me) return;
    recordedRef.current = true;

    const startedAt = arenaGameStartedAt.value ?? Date.now();
    const mins = Math.max(0.5, (Date.now() - startedAt) / 60000);
    const estimatedWpm = Math.round((me.wordsTyped * 5) / mins);
    const prevLevel = playerLevel.value;

    const newAchievements = recordGame({
      wpm: estimatedWpm,
      accuracy: 90,        // server doesn't track per-player accuracy yet
      score: me.score,
      isWin: isSurvivor,
      promptId: 'multiplayer',
    });

    const didLevelUp = playerLevel.value !== prevLevel;
    const toastDelay = didLevelUp ? 2400 : 0;
    newAchievements.forEach((id, i) => {
      const a = ACHIEVEMENTS.find(a => a.id === id);
      if (a) setTimeout(() => showToast(`${a.icon} ${a.title} unlocked!`, 'success', 4000), toastDelay + i * 400);
    });
  }, []);

  // Podium: 2nd, 1st, 3rd (center = winner)
  const podiumOrder   = [top3[1], top3[0], top3[2]].filter((p): p is typeof top3[0] => Boolean(p));
  const podiumHeights = [PODIUM_HEIGHTS[1], PODIUM_HEIGHTS[0], PODIUM_HEIGHTS[2]];
  const podiumColors  = [PODIUM_COLORS[1], PODIUM_COLORS[0], PODIUM_COLORS[2]];
  const podiumMedals  = [MEDAL[1], MEDAL[0], MEDAL[2]];

  function handlePlayAgain() {
    connectToRoom(roomId);
    sendMsg({ type: 'join', playerName: myName, roomId, color: arenaPlayerColor.value, isHost });
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px', position: 'relative' }}>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
        <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--c-accent)', letterSpacing: '-0.5px' }}>
          Game Over!
        </div>
        {me && (
          <div style={{ fontSize: '14px', color: 'var(--c-muted)', marginTop: '6px' }}>
            {me.id === survivorId
              ? <><strong style={{ color: '#f7df4b' }}>👑 You survived!</strong> — {myScore.toLocaleString()} pts</>
              : <>You finished <strong style={{ color: 'var(--c-text)' }}>#{me.rank}</strong> · <strong style={{ color: 'var(--c-accent)' }}>{myScore.toLocaleString()} pts</strong> · {me.wordsTyped} words</>
            }
          </div>
        )}
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {podiumOrder.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{podiumMedals[i]}</div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800, color: '#000', marginBottom: '4px',
                boxShadow: p.id === myId ? '0 0 0 3px var(--c-accent)' : 'none',
              }}>
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{
                fontSize: '13px', fontWeight: 700,
                color: p.id === myId ? 'var(--c-accent)' : 'var(--c-text)',
                marginBottom: '2px', maxWidth: '130px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                {p.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginBottom: '6px' }}>
                {p.score.toLocaleString()} pts · {p.wordsTyped}w
              </div>
              <div
                class="podium-bar"
                style={{
                  width: '100%', height: podiumHeights[i],
                  background: podiumColors[i] + '33',
                  border: `2px solid ${podiumColors[i]}`,
                  borderRadius: '6px 6px 0 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 900, color: podiumColors[i],
                }}
              >
                {i === 1 ? 1 : i === 0 ? 2 : 3}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full leaderboard */}
      {ranked.length > 0 && (
        <div style={{ border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <div
            class="leaderboard-grid-header"
            style={{
              padding: '10px 16px', background: 'var(--c-surface-alt)',
              fontSize: '11px', fontWeight: 700, color: 'var(--c-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'grid', gridTemplateColumns: '40px 1fr 60px 70px 80px',
            }}>
            <span>#</span>
            <span>Player</span>
            <span class="leaderboard-hp-col" style={{ textAlign: 'center' }}>HP</span>
            <span style={{ textAlign: 'right' }}>Words</span>
            <span style={{ textAlign: 'right' }}>Score</span>
          </div>
          {ranked.map((p, idx) => (
            <div
              key={p.id}
              class="leaderboard-row leaderboard-grid-row"
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--c-border)',
                display: 'grid',
                gridTemplateColumns: '40px 1fr 60px 70px 80px',
                alignItems: 'center',
                background: p.id === myId ? 'var(--c-accent)0d' : 'transparent',
                animationDelay: `${idx * 0.06}s`,
              }}
            >
              <span style={{ fontSize: '16px' }}>{MEDAL[p.rank - 1] ?? `#${p.rank}`}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{
                  fontWeight: p.id === myId ? 700 : 400, color: 'var(--c-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.name}
                  {p.id === myId && <span style={{ color: 'var(--c-muted)', fontWeight: 400, fontSize: '11px' }}> (you)</span>}
                  {p.id === survivorId && <span style={{ marginLeft: 4 }}>👑</span>}
                </span>
              </div>
              <div class="leaderboard-hp-col" style={{ textAlign: 'center' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: '10px', opacity: i < p.hp ? 1 : 0.2 }}>♥</span>
                ))}
              </div>
              <span style={{ textAlign: 'right', fontSize: '13px', color: 'var(--c-text)' }}>
                {p.wordsTyped}
              </span>
              <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--c-accent)' }}>
                {p.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={closeArena} class="btn-icon" style={{ padding: '8px 20px', fontSize: '14px' }}>
          ← Back to Editor
        </button>
        <button onClick={handlePlayAgain} class="arena-btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
