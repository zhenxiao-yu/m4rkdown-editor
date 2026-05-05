// Procedural sound engine — Web Audio API, zero bundle cost

let _ctx: AudioContext | null = null;
let _muted = false;
try { _muted = localStorage.getItem('arena-muted') === 'true'; } catch {}

function ac(): AudioContext | null {
  if (_muted) return null;
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch { return null; }
}

export function sfxSetMuted(v: boolean) {
  _muted = v;
  try { localStorage.setItem('arena-muted', String(v)); } catch {}
}
export function sfxIsMuted() { return _muted; }

// ── Primitives ────────────────────────────────────────────────────

function osc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  startAt: number,
  dur: number,
  vol: number,
  freqEnd?: number,
) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g); g.connect(c.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, startAt);
  if (freqEnd !== undefined)
    o.frequency.exponentialRampToValueAtTime(freqEnd, startAt + dur);
  g.gain.setValueAtTime(vol, startAt);
  g.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
  o.start(startAt); o.stop(startAt + dur + 0.01);
}

function noise(c: AudioContext, startAt: number, dur: number, vol: number) {
  const size = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, size, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  src.connect(g); g.connect(c.destination);
  g.gain.setValueAtTime(vol, startAt);
  g.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
  src.start(startAt); src.stop(startAt + dur + 0.01);
}

// ── Public SFX ───────────────────────────────────────────────────

/** Word destroyed — pitch climbs with combo */
export function sfxPop(combo = 1) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const base = 300 + Math.min(combo - 1, 9) * 50;
  osc(c, 'sine',     base * 0.9, t,        0.05, 0.14, base * 2.2);
  osc(c, 'triangle', base * 1.5, t + 0.02, 0.12, 0.06);
}

/** Key typed on target word — ultra-subtle tick */
export function sfxTick() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  osc(c, 'square', 1800, t, 0.025, 0.03);
}

/** HP lost */
export function sfxMiss() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  osc(c, 'sawtooth', 180, t, 0.28, 0.18, 40);
  noise(c, t, 0.12, 0.07);
}

/** Combo milestone — ascending arpeggio */
export function sfxCombo(combo: number) {
  const c = ac(); if (!c) return;
  const steps = Math.min(combo - 2, 4);
  const scale = [440, 554, 659, 784, 1047];
  for (let i = 0; i <= steps; i++) {
    osc(c, 'triangle', scale[i], c.currentTime + i * 0.07, 0.14, 0.09);
  }
}

/** Countdown beep */
export function sfxCountdown(n: number) {
  const c = ac(); if (!c) return;
  const freq = n === 1 ? 880 : 440;
  osc(c, 'square', freq, c.currentTime, 0.09, 0.07);
}

/** GO! */
export function sfxGo() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => {
    osc(c, 'triangle', f, t + i * 0.06, 0.25, 0.12);
  });
}

/** Player died */
export function sfxDead() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  [330, 220, 165, 110].forEach((f, i) => {
    osc(c, 'sawtooth', f, t + i * 0.1, 0.2, 0.15);
  });
  noise(c, t + 0.1, 0.3, 0.05);
}

/** Victory jingle */
export function sfxWin() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 659, 784, 1047].forEach((f, i) => {
    osc(c, 'triangle', f, t + i * 0.1, 0.22, 0.1);
  });
}
