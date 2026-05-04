import { useEffect, useRef } from 'preact/hooks';
import { arenaCountdownT, tickCountdown } from '@/store/arena';

const BG_COLORS = ['', '#dc2626', '#d97706', '#16a34a'];  // index = countdown number
const RING_CIRCUMFERENCE = 283; // 2π × 45 ≈ 283

export function CountdownView() {
  const rafRef = useRef<number>(0);
  const count  = arenaCountdownT.value;
  const isGo   = count === 0;

  useEffect(() => {
    function tick() {
      const done = tickCountdown();
      if (!done) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const bgColor = isGo ? '#16a34a' : (BG_COLORS[count] ?? '#16a34a');
  const ringColor = isGo ? '#22c55e' : bgColor;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${bgColor}18`,
      transition: 'background 0.3s ease',
      gap: '16px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Game starts in
      </div>

      {/* SVG countdown ring + number */}
      <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!isGo && (
          <svg
            width="160"
            height="160"
            style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx="80" cy="80" r="70"
              fill="none"
              stroke={`${ringColor}22`}
              strokeWidth="4"
            />
            {/* Animated ring — key forces remount each second */}
            <circle
              key={count}
              cx="80" cy="80" r="70"
              fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="440"
              strokeDashoffset="0"
              class="countdown-ring-circle"
              style={{
                '--ring-end': '440',
                animation: 'ring-shrink 1s linear forwards',
              } as Record<string, string>}
            />
          </svg>
        )}

        <div
          key={count}
          class="arena-countdown-number"
          style={{
            fontSize: isGo ? '80px' : '100px',
            fontWeight: 900,
            color: isGo ? '#22c55e' : bgColor,
            lineHeight: 1,
            textShadow: `0 0 40px ${bgColor}88`,
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'none',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {isGo ? 'GO!' : count}
        </div>
      </div>

      <div style={{ fontSize: '14px', color: 'var(--c-muted)' }}>
        Get your fingers ready…
      </div>
    </div>
  );
}
