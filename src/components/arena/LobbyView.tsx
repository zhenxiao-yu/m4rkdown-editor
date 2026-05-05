import { useState } from 'preact/hooks';
import {
  arenaRoomId, arenaPlayers, arenaHostId, arenaPlayerId, arenaIsHost,
} from '@/store/arena';
import { sendMsg } from '@/lib/partykit-client';
import { showToast } from '@/store/toast';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function LobbyView() {
  const roomId  = arenaRoomId.value;
  const players = arenaPlayers.value;
  const hostId  = arenaHostId.value;
  const myId    = arenaPlayerId.value;
  const isHost  = arenaIsHost.value;
  const [copied, setCopied]         = useState(false);
  const [madePublic, setMadePublic] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(roomId)
      .then(() => showToast('Room code copied!', 'success'))
      .catch(() => showToast('Copy failed — select code manually', 'error'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMakePublic() {
    sendMsg({ type: 'publish' });
    setMadePublic(true);
  }

  function handleStart() {
    sendMsg({ type: 'start' });
  }

  return (
    <div class="lobby-layout">

      {/* Left — player list */}
      <div class="lobby-sidebar glass-panel">
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Room Code
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: 'var(--c-accent)', letterSpacing: '0.12em' }}>
              {roomId}
            </span>
            <button onClick={copyCode} class="btn-icon" style={{ fontSize: '12px', padding: '3px 8px' }}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--c-muted)', marginTop: '6px' }}>
            Share this code to invite friends
          </div>
        </div>

        <div style={{ padding: '12px 20px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Players ({players.length}/8)
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
          {players.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px', borderRadius: '8px',
                background: p.id === myId ? 'var(--c-accent)12' : 'transparent',
              }}
            >
              {/* Color avatar */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#000', flexShrink: 0,
                boxShadow: p.id === hostId ? `0 0 0 2px var(--c-accent)` : 'none',
              }}>
                {initials(p.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: p.id === myId ? 700 : 400, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name} {p.id === myId && <span style={{ color: 'var(--c-muted)', fontWeight: 400 }}>(you)</span>}
                </div>
                {p.id === hostId && (
                  <div style={{ fontSize: '11px', color: 'var(--c-accent)', fontWeight: 600 }}>Host</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {isHost ? (
          <div style={{ padding: '12px', borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!madePublic ? (
              <button onClick={handleMakePublic} class="btn-icon" style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}>
                🌐 Make Public
              </button>
            ) : (
              <div style={{ fontSize: '12px', color: '#22c55e', textAlign: 'center' }}>✓ Listed publicly</div>
            )}
            <button
              onClick={handleStart}
              disabled={players.length < 1}
              class="arena-btn-primary"
              style={{ width: '100%' }}
            >
              ▶ Start Game
            </button>
          </div>
        ) : (
          <div style={{ padding: '14px', borderTop: '1px solid var(--c-border)', textAlign: 'center', color: 'var(--c-muted)', fontSize: '13px' }}>
            Waiting for host to start…
          </div>
        )}
      </div>

      {/* Right — game mode info */}
      <div class="lobby-content glass-panel">
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--c-accent)', marginBottom: '8px', fontFamily: 'var(--font-ui)' }}>
            ⚔️ Survival Mode
          </div>
          <p style={{ fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.7, margin: '0 0 24px', fontFamily: 'var(--font-ui)' }}>
            Words fall from the sky — type them before they hit the ground to destroy them.
            Miss a word and you lose <strong style={{ color: '#ef4444' }}>1 HP</strong>.
            Lose all 5 HP and you're out. <strong style={{ color: 'var(--c-accent)' }}>Last player standing wins!</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <RuleCard icon="🌊" title="9 Waves" desc="25 seconds each — words get faster and longer as you survive." />
            <RuleCard icon="💀" title="5 Lives" desc="Each missed word costs 1 HP. Reach zero and spectate." />
            <RuleCard icon="⚡" title="Combo Streaks" desc="Consecutive destroys multiply your score. Keep the chain alive." />
            <RuleCard icon="👥" title="Claim Words" desc="First to start typing a word locks it — no sharing." />
          </div>

          <div style={{ padding: '14px 16px', background: '#f7df4b10', border: '1px solid #f7df4b30', borderRadius: '8px', fontSize: '13px', color: 'var(--c-muted)', fontFamily: 'var(--font-ui)' }}>
            💡 <strong style={{ color: 'var(--c-text)' }}>Tip:</strong> Type the first letter of any falling word to lock it. Backspace won't help — commit or move on!
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--c-border)', background: 'var(--c-surface-alt)' }}>
      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text)', marginBottom: '4px', fontFamily: 'var(--font-ui)' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--c-muted)', lineHeight: 1.5, fontFamily: 'var(--font-ui)' }}>{desc}</div>
    </div>
  );
}
