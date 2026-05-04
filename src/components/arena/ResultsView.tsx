import { useEffect, useState } from 'preact/hooks';
import { arenaLeaderboard, arenaPlayerId, arenaMyScore, arenaMyRank, arenaWpm, arenaAccuracy, arenaRoomId, closeArena, arenaPlayerName, arenaIsHost } from '@/store/arena';
import { connectToRoom, sendMsg } from '@/lib/partykit-client';

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = ['120px', '90px', '70px'];
const PODIUM_COLORS  = ['#f7df4b', '#9ca3af', '#cd7f32'];

function Confetti() {
  const colors = ['var(--game-correct)', 'var(--game-combo)', 'var(--c-accent)', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          class="arena-confetti-piece"
          style={{
            left: `${3 + i * 3.2}%`,
            animationDelay: `${(i * 0.05).toFixed(2)}s`,
            animationDuration: `${1.0 + (i % 6) * 0.25}s`,
            background: colors[i % colors.length],
            borderRadius: i % 3 === 0 ? '50%' : '2px',
            width: i % 4 === 0 ? '12px' : '9px',
            height: i % 4 === 0 ? '12px' : '9px',
          }}
        />
      ))}
    </div>
  );
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let raf: number;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      setValue(current);

      if (current !== target) {
        setPopped(false);
      }

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setValue(target);
        setPopped(true);
        setTimeout(() => setPopped(false), 200);
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return { value, popped };
}

export function ResultsView({ onClose }: { onClose?: () => void }) {
  const board    = arenaLeaderboard.value;
  const myId     = arenaPlayerId.value;
  const myScore  = arenaMyScore.value;
  const myRank   = arenaMyRank.value;
  const myWpm    = arenaWpm.value;
  const myAcc    = arenaAccuracy.value;
  const roomId   = arenaRoomId.value;
  const myName   = arenaPlayerName.value;
  const isHost   = arenaIsHost.value;

  const { value: displayScore, popped } = useCountUp(myScore);

  const top3  = board.slice(0, 3);
  const rest  = board.slice(3);

  // Podium order: 2nd, 1st, 3rd (Kahoot style)
  const podiumOrder   = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = [PODIUM_HEIGHTS[1], PODIUM_HEIGHTS[0], PODIUM_HEIGHTS[2]];
  const podiumColors  = [PODIUM_COLORS[1], PODIUM_COLORS[0], PODIUM_COLORS[2]];
  const podiumMedals  = [MEDAL[1], MEDAL[0], MEDAL[2]];
  const podiumRanks   = [2, 1, 3];

  function handleClose() {
    closeArena();
    onClose?.();
  }

  function handlePlayAgain() {
    connectToRoom(roomId);
    sendMsg({ type: 'join', playerName: myName, roomId, isHost });
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px', position: 'relative' }}>
      <Confetti />

      <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
        <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--c-accent)', letterSpacing: '-0.5px' }}>
          Game Over!
        </div>
        {myRank > 0 && (
          <div style={{ fontSize: '14px', color: 'var(--c-muted)', marginTop: '6px' }}>
            You finished <strong style={{ color: 'var(--c-text)' }}>#{myRank}</strong> with{' '}
            <strong
              style={{ color: 'var(--c-accent)', fontSize: '16px' }}
              class={popped ? 'score-count-pop' : ''}
            >
              {displayScore} pts
            </strong>{' '}
            · {myWpm} WPM · {myAcc}% accuracy
          </div>
        )}
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {podiumOrder.map((p, i) => p && (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{podiumMedals[i]}</div>
              <div style={{
                fontSize: '13px', fontWeight: 700,
                color: p.id === myId ? 'var(--c-accent)' : 'var(--c-text)',
                marginBottom: '4px', maxWidth: '130px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                {p.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--c-muted)', marginBottom: '6px' }}>{p.score} pts</div>
              <div
                class="podium-bar"
                style={{
                  width: '100%',
                  height: podiumHeights[i],
                  background: podiumColors[i] + '33',
                  border: `2px solid ${podiumColors[i]}`,
                  borderRadius: '6px 6px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: podiumColors[i],
                }}
              >
                {podiumRanks[i]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full leaderboard */}
      {board.length > 0 && (
        <div style={{ border: '1px solid var(--c-border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '10px 16px', background: 'var(--c-surface-alt)', fontSize: '11px', fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px' }}>
            <span>#</span><span>Player</span><span style={{ textAlign: 'right' }}>WPM</span><span style={{ textAlign: 'right' }}>Acc</span><span style={{ textAlign: 'right' }}>Score</span>
          </div>
          {board.map((p, idx) => (
            <div
              key={p.id}
              class="leaderboard-row"
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--c-border)',
                display: 'grid',
                gridTemplateColumns: '40px 1fr 80px 80px 80px',
                alignItems: 'center',
                background: p.id === myId ? 'var(--c-accent)0d' : 'transparent',
                animationDelay: `${idx * 0.06}s`,
              }}
            >
              <span style={{ fontSize: '14px' }}>{MEDAL[p.rank - 1] ?? `#${p.rank}`}</span>
              <span style={{ fontWeight: p.id === myId ? 700 : 400, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name} {p.id === myId && <span style={{ color: 'var(--c-muted)', fontWeight: 400, fontSize: '11px' }}>(you)</span>}
              </span>
              <span style={{ textAlign: 'right', fontSize: '13px', color: 'var(--c-text)' }}>{p.wpm}</span>
              <span style={{ textAlign: 'right', fontSize: '13px', color: p.accuracy >= 95 ? '#22c55e' : p.accuracy >= 80 ? '#f59e0b' : 'var(--c-danger)' }}>{p.accuracy}%</span>
              <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--c-accent)' }}>{p.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={handleClose} class="btn-icon" style={{ padding: '8px 20px', fontSize: '14px' }}>
          Back to Menu
        </button>
        <button onClick={handlePlayAgain} class="arena-btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
