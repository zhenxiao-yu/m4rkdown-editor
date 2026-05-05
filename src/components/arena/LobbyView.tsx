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
    showToast('Room is now listed publicly', 'success');
  }

  function handleStart() {
    sendMsg({ type: 'start' });
  }

  const emptySlots = Math.max(0, 8 - players.length);

  return (
    <div class="lobby-centered">

      {/* ── Room code hero ── */}
      <div class="lobby-hero">
        <div class="lobby-hero-label">Room Code</div>
        <div class="lobby-hero-code">{roomId}</div>
        <div class="lobby-hero-actions">
          <button onClick={copyCode} class={`lobby-copy-btn${copied ? ' copied' : ''}`}>
            {copied ? '✓ Copied' : '📋 Copy Code'}
          </button>
          {isHost && !madePublic && (
            <button onClick={handleMakePublic} class="lobby-copy-btn">
              🌐 Make Public
            </button>
          )}
          {madePublic && (
            <span class="lobby-public-badge">✓ Listed publicly</span>
          )}
        </div>
        <div class="lobby-hero-hint">Share this code with your friends to join</div>
      </div>

      {/* ── Players ── */}
      <div class="lobby-section">
        <div class="lobby-section-header">
          <span>Players</span>
          <span class="lobby-player-count">{players.length} / 8</span>
        </div>

        <div class="lobby-player-grid">
          {players.map(p => (
            <div
              key={p.id}
              class={`lobby-player-card${p.id === myId ? ' me' : ''}${p.id === hostId ? ' host' : ''}`}
            >
              <div class="lobby-player-avatar" style={{ background: p.color }}>
                {initials(p.name)}
                {p.id === hostId && <span class="lobby-host-crown">👑</span>}
              </div>
              <div class="lobby-player-name">{p.name}</div>
              {p.id === myId && <div class="lobby-player-you">you</div>}
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} class="lobby-player-card empty">
              <div class="lobby-player-avatar empty">
                <span style={{ fontSize: 18, opacity: 0.3 }}>+</span>
              </div>
              <div class="lobby-player-name" style={{ opacity: 0.3 }}>Waiting…</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rules ── */}
      <div class="lobby-rules-strip">
        <RuleChip icon="🌊" text="9 Waves" />
        <RuleChip icon="💀" text="5 Lives" />
        <RuleChip icon="⚡" text="Combo Streaks" />
        <RuleChip icon="👥" text="Claim Words" />
        <RuleChip icon="🏆" text="Last One Standing" />
      </div>

      {/* ── Action ── */}
      <div class="lobby-action">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < 1}
            class="arena-btn-primary lobby-start-btn"
          >
            ▶ Start Game
          </button>
        ) : (
          <div class="lobby-waiting">
            <div class="lobby-waiting-dots">
              <span /><span /><span />
            </div>
            Waiting for host to start the game
          </div>
        )}
      </div>

    </div>
  );
}

function RuleChip({ icon, text }: { icon: string; text: string }) {
  return (
    <div class="lobby-rule-chip">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
