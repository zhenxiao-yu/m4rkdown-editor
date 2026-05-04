import { useState } from 'preact/hooks';
import {
  arenaRoomId, arenaPlayers, arenaHostId, arenaPlayerId,
  arenaIsHost, arenaPrompt, arenaIsPublic,
} from '@/store/arena';
import { sendMsg } from '@/lib/partykit-client';

const DIFF_COLORS: Record<string, string> = {
  easy: '#16a34a', medium: '#d97706', hard: '#dc2626', custom: '#7c3aed',
};

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function LobbyView() {
  const roomId   = arenaRoomId.value;
  const players  = arenaPlayers.value;
  const hostId   = arenaHostId.value;
  const myId     = arenaPlayerId.value;
  const isHost   = arenaIsHost.value;
  const prompt   = arenaPrompt.value;
  const isPublic = arenaIsPublic.value;
  const [copied, setCopied] = useState(false);
  const [madePublic, setMadePublic] = useState(isPublic);

  function copyCode() {
    navigator.clipboard.writeText(roomId).catch(() => {});
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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left — player list */}
      <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Room Code
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--c-accent)',
              letterSpacing: '0.12em',
            }}>
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
          Players ({players.length})
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
          {players.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                borderRadius: '8px',
                background: p.id === myId ? 'var(--c-accent)12' : 'transparent',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: p.id === hostId ? 'var(--c-accent)' : 'var(--c-btn)',
                color: p.id === hostId ? 'var(--c-accent-fg)' : 'var(--c-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                flexShrink: 0,
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

        {isHost && (
          <div style={{ padding: '12px', borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!madePublic && (
              <button
                onClick={handleMakePublic}
                class="btn-icon"
                style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
              >
                🌐 Make Public
              </button>
            )}
            {madePublic && (
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
        )}
        {!isHost && (
          <div style={{ padding: '14px', borderTop: '1px solid var(--c-border)', textAlign: 'center', color: 'var(--c-muted)', fontSize: '13px' }}>
            Waiting for host to start…
          </div>
        )}
      </div>

      {/* Right — prompt preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {prompt && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Challenge Prompt
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--c-text)' }}>{prompt.title}</span>
                <span class="arena-badge" style={{ background: DIFF_COLORS[prompt.difficulty] }}>
                  {prompt.difficulty}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--c-muted)' }}>~{prompt.estimatedWords} words</span>
              </div>
            </div>

            <pre style={{
              background: 'var(--c-surface-alt)',
              border: '1px solid var(--c-border)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '12px',
              lineHeight: '1.7',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--c-text)',
              fontFamily: 'monospace',
              maxHeight: '350px',
            }}>
              {prompt.content}
            </pre>

            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f7df4b10', border: '1px solid #f7df4b30', borderRadius: '8px', fontSize: '13px', color: 'var(--c-muted)' }}>
              💡 <strong style={{ color: 'var(--c-text)' }}>Tip:</strong> Type the prompt exactly as shown — spaces, punctuation, and case all matter!
            </div>
          </>
        )}
      </div>
    </div>
  );
}
