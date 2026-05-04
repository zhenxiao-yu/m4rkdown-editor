import { arenaView, openArena } from '@/store/arena';

export function ArenaButton({ onOpen }: { onOpen: () => void }) {
  const isActive = arenaView.value !== 'closed';

  return (
    <button
      onClick={onOpen}
      class={`btn-icon${isActive ? ' arena-btn-active' : ''}`}
      title="Typing Arena — compete with others!"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '13px',
        fontWeight: isActive ? 700 : 500,
        padding: '4px 10px',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: '15px' }}>🎮</span>
      <span>Arena</span>
      {isActive && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#22c55e',
          animation: 'arena-dot-pulse 1.5s ease-in-out infinite',
        }} />
      )}
    </button>
  );
}
