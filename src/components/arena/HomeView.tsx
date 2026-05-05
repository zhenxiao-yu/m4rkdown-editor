import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import {
  arenaError, arenaConnecting, arenaPublicRooms,
  arenaPlayerName, arenaIsHost, arenaPlayerColor, generateRoomCode,
} from '@/store/arena';
import { playerStats, playerLevel, playerXpInfo } from '@/store/arena-stats';
import { connectToRoom, connectToBrowse, sendMsg } from '@/lib/partykit-client';
import { customWordList } from '@/store/custom-words';
import { SoloPracticeView } from './SoloPracticeView';

type HomeTab  = 'solo' | 'multi';
type MultiTab = 'create' | 'join' | 'browse';

const homeTab = signal<HomeTab>('solo');

const PLAYER_COLORS = ['#f7df4b', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];

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

function ColorPicker() {
  const current = arenaPlayerColor.value;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {PLAYER_COLORS.map(c => (
        <button
          key={c}
          onClick={() => { arenaPlayerColor.value = c; }}
          style={{
            width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
            border: current === c ? '3px solid var(--c-text)' : '3px solid transparent',
            outline: current === c ? `2px solid ${c}` : 'none',
            outlineOffset: 2,
            padding: 0,
            transition: 'border 0.1s, outline 0.1s',
          }}
          title={c}
        />
      ))}
    </div>
  );
}

function MultiplayerView() {
  const [tab, setTab]           = useState<MultiTab>('create');
  const [name, setName]         = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isPublic, setPublic]   = useState(false);
  const [joinName, setJoinName] = useState('');

  const err        = arenaError.value;
  const connecting = arenaConnecting.value;

  function handleCreate() {
    const trimName = name.trim().slice(0, 20);
    if (!trimName) { arenaError.value = 'Please enter your name.'; return; }

    const code = generateRoomCode();
    arenaPlayerName.value = trimName;
    arenaIsHost.value     = true;
    arenaConnecting.value = true;
    arenaError.value      = null;

    const customWords = customWordList.value && customWordList.value.length >= 20
      ? btoa(customWordList.value.join(','))
      : undefined;

    connectToRoom(code);
    sendMsg({ type: 'join', playerName: trimName, roomId: code, color: arenaPlayerColor.value, isHost: true, customWords });

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
    arenaIsHost.value     = false;
    arenaConnecting.value = true;
    arenaError.value      = null;

    connectToRoom(trimCode);
    sendMsg({ type: 'join', playerName: trimName, roomId: trimCode, color: arenaPlayerColor.value, isHost: false });
  }

  function handleBrowseTab() {
    setTab('browse');
    connectToBrowse();
  }

  function handleJoinPublic(roomId: string) {
    const trimName = (joinName || name).trim().slice(0, 20);
    if (!trimName) { arenaError.value = 'Enter your name in the Join tab first.'; return; }
    arenaPlayerName.value = trimName;
    arenaIsHost.value     = false;
    arenaConnecting.value = true;
    arenaError.value      = null;
    connectToRoom(roomId);
    sendMsg({ type: 'join', playerName: trimName, roomId, color: arenaPlayerColor.value, isHost: false });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', padding: '0 20px', flexShrink: 0 }}>
        <button class="arena-tab-btn" style={tabStyle(tab === 'create')} onClick={() => setTab('create')}>Create Room</button>
        <button class="arena-tab-btn" style={tabStyle(tab === 'join')}   onClick={() => setTab('join')}>Join Room</button>
        <button class="arena-tab-btn" style={tabStyle(tab === 'browse')} onClick={handleBrowseTab}>Browse Public</button>
      </div>

      {err && (
        <div style={{ padding: '10px 20px', background: '#dc262622', color: '#f87171', fontSize: '13px', borderBottom: '1px solid #dc262644', flexShrink: 0 }}>
          {err}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

        {/* ── Create ── */}
        {tab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
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

            <Field label="Your Color">
              <ColorPicker />
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

            <div style={{ padding: '12px 16px', background: 'var(--c-surface-alt)', borderRadius: 8, border: '1px solid var(--c-border)', fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--c-text)' }}>Survival Mode</strong> — Words fall from the sky. Type them before they hit the bottom. Miss 5 and you're out. Last player standing wins!
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

            <Field label="Your Color">
              <ColorPicker />
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
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--c-text)' }}>
                    {r.hostName}'s room
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--c-muted)', marginTop: '3px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span>{r.playerCount} players</span>
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

function PlayerProfileCard() {
  const stats  = playerStats.value;
  const level  = playerLevel.value;
  const xpInfo = playerXpInfo.value;
  const name   = arenaPlayerName.value || 'Adventurer';
  const color  = stats.playerColor;

  return (
    <div class="player-profile-card">
      <div class="player-avatar" style={{ background: color }}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', fontFamily: 'var(--font-ui)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          <div class="battle-level-badge" style={{ flexShrink: 0 }}>
            <div class="battle-level-dot" style={{ background: level.color }} />
            {level.title}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 5, fontFamily: 'var(--font-ui)' }}>
          {stats.totalXp.toLocaleString()} XP · {stats.totalGames} games{stats.bestWpm > 0 ? ` · Best ${stats.bestWpm} WPM` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div class="player-xp-bar-track" style={{ flex: 1 }}>
            <div class="player-xp-bar-fill" style={{ width: `${xpInfo.pct * 100}%`, background: level.color }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--c-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
            {xpInfo.current}/{xpInfo.needed} XP
          </span>
        </div>
      </div>
    </div>
  );
}

export function HomeView() {
  const current = homeTab.value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PlayerProfileCard />
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', padding: '0 20px', flexShrink: 0, background: 'var(--c-surface)' }}>
        <button class="arena-tab-btn" style={tabStyle(current === 'solo')}  onClick={() => { homeTab.value = 'solo'; }}>⚡ Solo Practice</button>
        <button class="arena-tab-btn" style={tabStyle(current === 'multi')} onClick={() => { homeTab.value = 'multi'; }}>⚔️ Multiplayer</button>
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
