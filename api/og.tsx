// Vercel Edge Function — processed by Vercel's own build pipeline, not Vite.
// Uses React JSX (Vercel edge runtime bundles React); excluded from project tsconfig.
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const ACCENT  = '#f7df4b';
const BG      = '#111111';
const SURFACE = '#1a1a1a';
const BORDER  = '#2a2a2a';
const MUTED   = '#6b7280';
const TEXT    = '#e5e7eb';

const FEATURES = ['CodeMirror 6', 'Typing Arena', 'Real-time Collab', 'Offline PWA'];

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: BG, fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: ACCENT }} />

        {/* Corner decorations */}
        <div style={{ position: 'absolute', top: 40, left: 48, width: 80, height: 80, borderRadius: '50%', background: `${ACCENT}18`, display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: 60, right: 60, width: 120, height: 120, borderRadius: '50%', background: '#3b82f618', display: 'flex' }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 90, lineHeight: 1 }}>⚡</div>
            <div style={{ fontSize: 90, fontWeight: 900, color: ACCENT, letterSpacing: '-3px', lineHeight: 1 }}>
              M4rkdown
            </div>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 30, color: MUTED, marginBottom: 52, letterSpacing: '0.02em' }}>
            Fast · Beautiful · Offline-first Markdown Editor
          </div>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: 14 }}>
            {FEATURES.map(f => (
              <div
                key={f}
                style={{
                  padding: '12px 24px', borderRadius: 100,
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  color: TEXT, fontSize: 22, fontWeight: 500,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute', bottom: 32, right: 48,
            fontSize: 20, color: MUTED, letterSpacing: '0.04em',
          }}
        >
          m4rkdown-editor.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
