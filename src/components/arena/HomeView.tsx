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

function ColorPicker() {
  const current = arenaPlayerColor.value;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      {PLAYER_COLORS.map(c => (
        <button
          key={c}
          onClick={() => { arenaPlayerColor.value = c; }}
          style={{
            width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
            border: current === c ? '3px solid var(--c-text)' : '3px solid transparent',
            outline: current === c ? `2px solid ${c}` : 'none',
            outlineOffset: 2, padding: 0,
            transition: 'border 0.12s, outline 0.12s, transform 0.12s',
            transform: current === c ? 'scale(1.15)' : 'scale(1)',
          }}
          title={c}
        />
      ))}
    </div>
  );
}

function MultiplayerHub() {
  const [tab, setTab]           = useState<MultiTab>('create');
  const [name, setName]         = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isPublic, setPublic]   = useState(false);
  const [joinName, setJoinName] = useState('');

  const err        = arenaError.value;
  const connecting = arenaConnecting.value;

  function handleCreate() {
    const trimName = name.trim().slice(0, 20);
    if (!trimName) { arenaError.value = 'Enter your name to continue.'; return; }
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
    if (isPublic) setTimeout(() => sendMsg({ type: 'publish' }), 500);
  }

  function handleJoin() {
    const trimName = joinName.trim().slice(0, 20);
    const trimCode = roomCode.trim().toUpperCase();
    if (!trimName) { arenaError.value = 'Enter your name to continue.'; return; }
    if (!trimCode) { arenaError.value = 'Enter a room code.'; return; }
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
    <div class="arena-mp-hub">
      {/* Sub-nav pills */}
      <div class="arena-mp-nav">
        <button class={`arena-mp-tab${tab === 'create' ? ' active' : ''}`} onClick={() => setTab('create')}>+ Create</button>
        <button class={`arena-mp-tab${tab === 'join'   ? ' active' : ''}`} onClick={() => setTab('join')}>→ Join</button>
        <button class={`arena-mp-tab${tab === 'browse' ? ' active' : ''}`} onClick={handleBrowseTab}>🌐 Browse</button>
      </div>

      {err && (
        <div class="arena-error-bar">{err}</div>
      )}

      <div class="arena-mp-content">

        {/* ── Create ── */}
        {tab === 'create' && (
          <div class="arena-form-card">
            <div class="arena-form-card-title">Host a Room</div>
            <div class="arena-form-card-sub">You'll get a room code to share with friends.</div>

            <div class="arena-field">
              <label class="arena-field-label">Your Name</label>
              <input
                class="arena-input"
                type="text"
                placeholder="e.g. Alice"
                maxLength={20}
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="arena-field">
              <label class="arena-field-label">Your Color</label>
              <ColorPicker />
            </div>

            <label class="arena-toggle-row">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setPublic((e.target as HTMLInputElement).checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-accent)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>List room publicly so anyone can browse and join</span>
            </label>

            <button onClick={handleCreate} disabled={connecting} class="arena-btn-primary arena-btn-lg">
              {connecting ? 'Creating room…' : '🚀 Create Room'}
            </button>

            <div class="arena-mode-tip">
              <strong>Survival Mode</strong> — Words fall from the sky. Type them before they hit the bottom. Miss 5 and you're out. Last player standing wins.
            </div>
          </div>
        )}

        {/* ── Join ── */}
        {tab === 'join' && (
          <div class="arena-form-card">
            <div class="arena-form-card-title">Join a Room</div>
            <div class="arena-form-card-sub">Enter the code your host shared with you.</div>

            <div class="arena-field">
              <label class="arena-field-label">Room Code</label>
              <input
                class="arena-input arena-code-input"
                type="text"
                placeholder="M4-XXX"
                maxLength={6}
                value={roomCode}
                onInput={(e) => {
                  const v = (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  setRoomCode(v);
                }}
              />
            </div>

            <div class="arena-field">
              <label class="arena-field-label">Your Name</label>
              <input
                class="arena-input"
                type="text"
                placeholder="e.g. Bob"
                maxLength={20}
                value={joinName}
                onInput={(e) => setJoinName((e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="arena-field">
              <label class="arena-field-label">Your Color</label>
              <ColorPicker />
            </div>

            <button onClick={handleJoin} disabled={connecting} class="arena-btn-primary arena-btn-lg">
              {connecting ? 'Joining…' : '🔑 Join Room'}
            </button>
          </div>
        )}

        {/* ── Browse ── */}
        {tab === 'browse' && (
          <div class="arena-browse">
            {arenaPublicRooms.value.length === 0 ? (
              <div class="arena-empty-state">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏟️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>No public rooms open</div>
                <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>Create one and make it public to appear here.</div>
              </div>
            ) : (
              <div class="arena-room-list">
                {arenaPublicRooms.value.map(r => (
                  <div key={r.roomId} class="arena-room-card">
                    <div class="arena-room-card-info">
                      <div class="arena-room-card-host">{r.hostName}'s room</div>
                      <div class="arena-room-card-meta">
                        <span>{r.playerCount} / 8 players</span>
                        <span class={`arena-room-status ${r.status === 'playing' ? 'playing' : 'open'}`}>
                          {r.status === 'playing' ? 'In Progress' : 'Open'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinPublic(r.roomId)}
                      disabled={r.status === 'playing' || connecting}
                      class="arena-btn-primary"
                      style={{ flexShrink: 0 }}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          <span style={{ fontSize: 10, color: xpInfo.isMax ? level.color : 'var(--c-muted)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontWeight: xpInfo.isMax ? 700 : 400 }}>
            {xpInfo.isMax ? '✦ MAX RANK' : `${xpInfo.current}/${xpInfo.needed} XP`}
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

      {/* Mode nav */}
      <div class="arena-mode-nav">
        <button class={`arena-mode-pill${current === 'solo'  ? ' active' : ''}`} onClick={() => { homeTab.value = 'solo';  }}>⚡ Solo Practice</button>
        <button class={`arena-mode-pill${current === 'multi' ? ' active' : ''}`} onClick={() => { homeTab.value = 'multi'; }}>⚔️ Multiplayer</button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {current === 'solo'  && <SoloPracticeView />}
        {current === 'multi' && <MultiplayerHub />}
      </div>
    </div>
  );
}
