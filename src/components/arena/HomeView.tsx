import { signal } from '@preact/signals';
import { ARENA_PROMPTS, getRandomPrompt } from '@/lib/arena-prompts';
import type { ArenaPrompt, Difficulty } from '@/lib/arena-types';
import {
  arenaError, arenaConnecting, arenaPublicRooms,
  arenaPlayerName, arenaIsHost, generateRoomCode,
} from '@/store/arena';
import { connectToRoom, connectToBrowse, sendMsg } from '@/lib/partykit-client';
import { SoloPracticeView } from './SoloPracticeView';
import { useState } from 'preact/hooks';

type HomeTab = 'solo' | 'multi';
type MultiTab = 'create' | 'join' | 'browse';

const homeTab = signal<HomeTab>('solo');

const DIFF_COLORS: Record<string, string> = {
  easy: '#16a34a', medium: '#d97706', hard: '#dc2626', custom: '#7c3aed',
};

function DiffBadge({ diff }: { diff: Difficulty }) {
  return (
    <span class={`arena-badge arena-badge-${diff}`} style={{ background: DIFF_COLORS[diff] }}>
      {diff}
    </span>
  );
}

function tabStyle(active: boolean) {
  return {
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: active ? 700 : 400,
    color: active ? 'var(--c-accent)' : 'var(--c-muted)',
    borderBottom: active ? '2px solid var(--c-accent)' : '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderRadius: 0,
    fontFamily: 'var(--font-ui)',
  } as const;
}

function MultiplayerView() {
  const [tab, setTab]           = useState<MultiTab>('create');
  const [name, setName]         = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [difficulty, setDiff]   = useState<Difficulty | 'random'>('random');
  const [selectedPrompt, setPrompt] = useState<ArenaPrompt | null>(null);
  const [customText, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [isPublic, setPublic]   = useState(false);
  const [joinName, setJoinName] = useState('');

  const err = arenaError.value;
  const connecting = arenaConnecting.value;

  function handleCreate() {
    const trimName = name.trim().slice(0, 20);
    if (!trimName) { arenaError.value = 'Please enter your name.'; return; }
    if (useCustom && !customText.trim()) { arenaError.value = 'Please enter a custom prompt.'; return; }

    const code = generateRoomCode();
    arenaPlayerName.value = trimName;
    arenaIsHost.value = true;
    arenaConnecting.value = true;
    arenaError.value = null;

    connectToRoom(code);

    sendMsg({
      type: 'join',
      playerName: trimName,
      roomId: code,
      isHost: true,
      ...(useCustom ? { customPrompt: customText.trim() } : { promptId: selectedPrompt?.id }),
    });

    if (isPublic) {
      setTimeout(() => sendMsg({ type: 'publish' }), 500);
    }
  }

  function handleJoin() {
    const trimName = joinName.trim().slice(0, 20);
    const trimCode = roomCode.trim().toUpperCase();
    if (!trimName) { arenaError.value = 'Please enter your name.'; return; }
    if (!trimCode) { arenaError.value = 'Please enter a room code.'; return; }

    arenaPlayerName.value = trimName;
    arenaIsHost.value = false;
    arenaConnecting.value = true;
    arenaError.value = null;

    connectToRoom(trimCode);
    sendMsg({ type: 'join', playerName: trimName, roomId: trimCode, isHost: false });
  }

  function handleBrowseTab() {
    setTab('browse');
    connectToBrowse();
  }

  function handleJoinPublic(roomId: string) {
    const trimName = (name || joinName).trim().slice(0, 20);
    if (!trimName) { arenaError.value = 'Enter your name in the Join tab first.'; return; }
    arenaPlayerName.value = trimName;
    arenaIsHost.value = false;
    arenaConnecting.value = true;
    arenaError.value = null;
    connectToRoom(roomId);
    sendMsg({ type: 'join', playerName: trimName, roomId, isHost: false });
  }

  const promptsToShow = difficulty === 'random'
    ? ARENA_PROMPTS
    : ARENA_PROMPTS.filter(p => p.difficulty === difficulty);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', padding: '0 20px', flexShrink: 0 }}>
        <button style={tabStyle(tab === 'create')} onClick={() => setTab('create')}>Create Room</button>
        <button style={tabStyle(tab === 'join')} onClick={() => setTab('join')}>Join Room</button>
        <button style={tabStyle(tab === 'browse')} onClick={handleBrowseTab}>Browse Public</button>
      </div>

      {err && (
        <div style={{ padding: '10px 20px', background: '#dc262622', color: '#f87171', fontSize: '13px', borderBottom: '1px solid #dc262644', flexShrink: 0 }}>
          {err}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

        {/* ── Create ── */}
        {tab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <Field label="Your Name">
              <input
                class="arena-input"
                type="text"
                placeholder="e.g. Alice"
                maxLength={20}
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
              />
            </Field>

            <Field label="Prompt">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {(['random', 'easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => { setDiff(d); setPrompt(null); setUseCustom(false); }}
                    style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      border: difficulty === d ? '2px solid var(--c-accent)' : '2px solid var(--c-border)',
                      background: difficulty === d ? 'var(--c-accent)20' : 'transparent',
                      color: difficulty === d ? 'var(--c-accent)' : 'var(--c-muted)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {d === 'random' ? 'Random' : d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
                <button
                  onClick={() => { setUseCustom(true); setPrompt(null); }}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    border: useCustom ? '2px solid #7c3aed' : '2px solid var(--c-border)',
                    background: useCustom ? '#7c3aed20' : 'transparent',
                    color: useCustom ? '#a78bfa' : 'var(--c-muted)',
                  }}
                >
                  Custom
                </button>
              </div>

              {useCustom ? (
                <textarea
                  class="arena-input"
                  placeholder="Paste your markdown prompt here..."
                  rows={6}
                  value={customText}
                  onInput={(e) => setCustom((e.target as HTMLTextAreaElement).value)}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflow: 'auto' }}>
                  {promptsToShow.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPrompt(p)}
                      style={{
                        textAlign: 'left', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                        border: selectedPrompt?.id === p.id ? '2px solid var(--c-accent)' : '2px solid var(--c-border)',
                        background: selectedPrompt?.id === p.id ? 'var(--c-accent)10' : 'var(--c-surface-alt)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--c-text)' }}>{p.title}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <DiffBadge diff={p.difficulty} />
                        <span style={{ fontSize: '11px', color: 'var(--c-muted)' }}>~{p.estimatedWords}w</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="public-toggle"
                checked={isPublic}
                onChange={(e) => setPublic((e.target as HTMLInputElement).checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label for="public-toggle" style={{ fontSize: '13px', color: 'var(--c-muted)', cursor: 'pointer' }}>
                List this room publicly (anyone can browse and join)
              </label>
            </div>

            <button onClick={handleCreate} disabled={connecting} class="arena-btn-primary">
              {connecting ? 'Creating…' : '🚀 Create Room'}
            </button>
          </div>
        )}

        {/* ── Join ── */}
        {tab === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
            <Field label="Room Code">
              <input
                class="arena-input"
                type="text"
                placeholder="M4-XXX"
                maxLength={6}
                value={roomCode}
                onInput={(e) => {
                  const v = (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  setRoomCode(v);
                }}
                style={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontSize: '18px', textAlign: 'center' }}
              />
            </Field>

            <Field label="Your Name">
              <input
                class="arena-input"
                type="text"
                placeholder="e.g. Bob"
                maxLength={20}
                value={joinName}
                onInput={(e) => setJoinName((e.target as HTMLInputElement).value)}
              />
            </Field>

            <button onClick={handleJoin} disabled={connecting} class="arena-btn-primary">
              {connecting ? 'Joining…' : '🔑 Join Room'}
            </button>
          </div>
        )}

        {/* ── Browse ── */}
        {tab === 'browse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {arenaPublicRooms.value.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--c-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏟️</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>No public rooms open</div>
                <div style={{ fontSize: '13px', marginTop: '6px' }}>Create one and make it public to appear here!</div>
              </div>
            ) : arenaPublicRooms.value.map(r => (
              <div
                key={r.roomId}
                style={{
                  padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--c-border)',
                  background: 'var(--c-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--c-text)' }}>{r.promptTitle}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-muted)', marginTop: '3px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span>Host: {r.hostName}</span>
                    <span>{r.playerCount}/{r.maxPlayers} players</span>
                    <DiffBadge diff={r.difficulty} />
                    <span style={{
                      padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                      background: r.status === 'playing' ? '#7c3aed22' : '#16a34a22',
                      color: r.status === 'playing' ? '#a78bfa' : '#22c55e',
                    }}>
                      {r.status === 'playing' ? 'In Progress' : 'Open'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinPublic(r.roomId)}
                  disabled={r.status === 'playing' || connecting}
                  class="arena-btn-primary"
                  style={{ flexShrink: 0, padding: '6px 16px', fontSize: '13px' }}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeView() {
  const current = homeTab.value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top-level tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', padding: '0 20px', flexShrink: 0, background: 'var(--c-surface)' }}>
        <button style={tabStyle(current === 'solo')} onClick={() => { homeTab.value = 'solo'; }}>
          ⚡ Solo Practice
        </button>
        <button style={tabStyle(current === 'multi')} onClick={() => { homeTab.value = 'multi'; }}>
          ⚔️ Multiplayer
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {current === 'solo'  && <SoloPracticeView />}
        {current === 'multi' && <MultiplayerView />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: preact.ComponentChildren }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
