/**
 * Generates public/og.png at build time using @vercel/og.
 * Run via: node scripts/gen-og.mjs
 * Called automatically by `npm run build` (see package.json).
 */
import { ImageResponse } from '@vercel/og';
import { writeFileSync } from 'node:fs';

const ACCENT  = '#f7df4b';
const BG      = '#111111';
const SURFACE = '#1a1a1a';
const BORDER  = '#2a2a2a';
const MUTED   = '#6b7280';
const TEXT    = '#e5e7eb';

const response = new ImageResponse(
  {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: BG, fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      },
      children: [
        // Top accent bar
        { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: ACCENT } } },
        // Corner blobs
        { type: 'div', props: { style: { position: 'absolute', top: 40, left: 48, width: 80, height: 80, borderRadius: '50%', background: `${ACCENT}18`, display: 'flex' } } },
        { type: 'div', props: { style: { position: 'absolute', bottom: 60, right: 60, width: 120, height: 120, borderRadius: '50%', background: '#3b82f618', display: 'flex' } } },
        // Main content
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 },
            children: [
              // Logo row
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
                  children: [
                    { type: 'div', props: { style: { fontSize: 90, lineHeight: 1 }, children: '⚡' } },
                    { type: 'div', props: { style: { fontSize: 90, fontWeight: 900, color: ACCENT, letterSpacing: '-3px', lineHeight: 1 }, children: 'M4rkdown' } },
                  ],
                },
              },
              // Tagline
              { type: 'div', props: { style: { fontSize: 30, color: MUTED, marginBottom: 52 }, children: 'Fast · Beautiful · Offline-first Markdown Editor' } },
              // Feature chips
              {
                type: 'div',
                props: {
                  style: { display: 'flex', gap: 14 },
                  children: ['CodeMirror 6', 'Typing Arena', 'Real-time Collab', 'Offline PWA'].map(f => ({
                    type: 'div',
                    props: {
                      key: f,
                      style: { padding: '12px 24px', borderRadius: 100, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 22, fontWeight: 500 },
                      children: f,
                    },
                  })),
                },
              },
            ],
          },
        },
        // Bottom URL
        { type: 'div', props: { style: { position: 'absolute', bottom: 32, right: 48, fontSize: 20, color: MUTED }, children: 'm4rkdown.is-a.dev' } },
      ],
    },
  },
  { width: 1200, height: 630 },
);

const buffer = await response.arrayBuffer();
writeFileSync('public/og.png', Buffer.from(buffer));
console.log('✓ public/og.png generated');
