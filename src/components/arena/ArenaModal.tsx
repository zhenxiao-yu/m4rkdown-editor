import { arenaView, closeArena } from '@/store/arena';
import { HomeView } from './HomeView';
import { LobbyView } from './LobbyView';
import { CountdownView } from './CountdownView';
import { GameView } from './GameView';
import { ResultsView } from './ResultsView';

const overlayStyle = {
  position: 'fixed' as const,
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.88)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle = {
  width: 'min(960px, 96vw)',
  height: 'min(700px, 94vh)',
  background: 'var(--c-surface)',
  border: '2px solid var(--c-accent)',
  borderRadius: '16px',
  boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 80px var(--c-accent)20',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  position: 'relative' as const,
};

export function ArenaModal() {
  const view = arenaView.value;

  const showClose = view === 'home' || view === 'lobby' || view === 'results';

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget && showClose) closeArena(); }}>
      <div style={modalStyle}>
        {/* Header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--c-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎮</span>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--c-accent)', letterSpacing: '-0.3px' }}>
              Typing Arena
            </span>
            {(view === 'lobby' || view === 'game' || view === 'countdown') && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
                background: view === 'game' ? '#16a34a22' : 'var(--c-btn)',
                color: view === 'game' ? '#22c55e' : 'var(--c-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {view === 'lobby' ? 'Lobby' : view === 'countdown' ? 'Get Ready' : 'Live'}
              </span>
            )}
          </div>
          {showClose && (
            <button
              onClick={closeArena}
              class="btn-icon"
              title="Close Arena"
              style={{ fontSize: '16px', padding: '4px 8px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* View content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'home'      && <HomeView />}
          {view === 'lobby'     && <LobbyView />}
          {view === 'countdown' && <CountdownView />}
          {view === 'game'      && <GameView />}
          {view === 'results'   && <ResultsView />}
        </div>
      </div>
    </div>
  );
}
