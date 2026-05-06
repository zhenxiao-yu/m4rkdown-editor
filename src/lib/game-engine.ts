// Deterministic game engine — seeded RNG + word queue generation
import { WORDS_T1, WORDS_T2, WORDS_T3, WORDS_T4 } from './word-list';

// ── Seeded RNG (Mulberry32) ───────────────────────────────────────────

export function mkRng(seed: number) {
  let s = seed >>> 0;
  return function rng(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Word definition ───────────────────────────────────────────────────

export interface WordDef {
  id: string;
  text: string;
  spawnAt: number;       // ms after game start
  fallDuration: number;  // ms to cross the play field top→bottom
  lane: number;          // 5–90 (% x position of left edge)
}

// ── Wave configuration ────────────────────────────────────────────────

interface WaveConfig {
  tiers: Array<1|2|3|4>;     // word tiers available
  intervalMs: number;         // avg ms between word spawns
  fallDurationMs: number;     // ms for word to fall full height
  wordsPerBatch: number;      // how many words to spawn at once (1 early, 2+ later)
}

const WAVES: WaveConfig[] = [
  // Wave 0 — 0–25s
  { tiers: [1],          intervalMs: 2800, fallDurationMs: 7000, wordsPerBatch: 1 },
  // Wave 1 — 25s
  { tiers: [1,1,2],      intervalMs: 2400, fallDurationMs: 6200, wordsPerBatch: 1 },
  // Wave 2 — 50s
  { tiers: [1,2,2],      intervalMs: 2100, fallDurationMs: 5600, wordsPerBatch: 1 },
  // Wave 3 — 75s
  { tiers: [2,2,3],      intervalMs: 1900, fallDurationMs: 5100, wordsPerBatch: 1 },
  // Wave 4 — 100s
  { tiers: [2,3,3],      intervalMs: 1700, fallDurationMs: 4700, wordsPerBatch: 2 },
  // Wave 5 — 125s
  { tiers: [2,3,3,4],    intervalMs: 1550, fallDurationMs: 4300, wordsPerBatch: 2 },
  // Wave 6 — 150s
  { tiers: [3,3,4],      intervalMs: 1400, fallDurationMs: 3900, wordsPerBatch: 2 },
  // Wave 7 — 175s
  { tiers: [3,4,4],      intervalMs: 1250, fallDurationMs: 3600, wordsPerBatch: 2 },
  // Wave 8+ — 200s+
  { tiers: [4,4,4],      intervalMs: 1100, fallDurationMs: 3200, wordsPerBatch: 3 },
];

const WAVE_DURATION_MS = 25_000;

function getWave(elapsedMs: number): WaveConfig {
  const idx = Math.min(Math.floor(elapsedMs / WAVE_DURATION_MS), WAVES.length - 1);
  return WAVES[idx];
}

type CustomTiers = Map<1|2|3|4, string[]> | null;

function buildCustomTiers(words: string[]): CustomTiers {
  const tiers = new Map<1|2|3|4, string[]>([[1,[]],[2,[]],[3,[]],[4,[]]]);
  for (const w of words) {
    const t: 1|2|3|4 = w.length <= 4 ? 1 : w.length <= 6 ? 2 : w.length <= 9 ? 3 : 4;
    tiers.get(t)!.push(w);
  }
  return tiers;
}

function pickWordForTier(rng: () => number, tier: 1|2|3|4, used: Set<string>, custom: CustomTiers): string {
  const customPool = custom?.get(tier);
  const pool = (customPool && customPool.length > 0)
    ? customPool
    : (tier === 1 ? WORDS_T1 : tier === 2 ? WORDS_T2 : tier === 3 ? WORDS_T3 : WORDS_T4);
  let attempts = 0;
  while (attempts < 20) {
    const w = rngPick(rng, pool);
    if (!used.has(w)) { used.add(w); return w; }
    attempts++;
  }
  return rngPick(rng, pool); // fallback
}

// Pre-generate enough words for MAX_GAME_MS (8 minutes)
const MAX_GAME_MS = 8 * 60_000;

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

const DIFFICULTY_SCALE: Record<Difficulty, { fall: number; interval: number }> = {
  easy:   { fall: 1.5,  interval: 1.4 },
  normal: { fall: 1.0,  interval: 1.0 },
  hard:   { fall: 0.75, interval: 0.70 },
  expert: { fall: 0.55, interval: 0.50 },
};

export function generateWordQueue(seed: number, customWords?: string[], difficulty: Difficulty = 'normal'): WordDef[] {
  const scale  = DIFFICULTY_SCALE[difficulty];
  const custom = customWords && customWords.length >= 20 ? buildCustomTiers(customWords) : null;
  const rng    = mkRng(seed);
  const words: WordDef[] = [];
  const used   = new Set<string>();
  let   t      = 1500;
  let   id     = 0;

  while (t < MAX_GAME_MS) {
    const wave = getWave(t);
    const tier = rngPick(rng, wave.tiers);

    for (let b = 0; b < wave.wordsPerBatch; b++) {
      const text = pickWordForTier(rng, tier, used, custom);
      let lane = rngInt(rng, 5, 85);
      if (b > 0) {
        const lastLane = words[words.length - 1]?.lane ?? 50;
        if (Math.abs(lane - lastLane) < 15) {
          lane = (lane + 20 + rngInt(rng, 0, 10)) % 80 + 5;
        }
      }
      words.push({
        id: `w${id++}`,
        text,
        spawnAt: t + b * 400,
        fallDuration: Math.round((wave.fallDurationMs + rngInt(rng, -200, 200)) * scale.fall),
        lane,
      });
    }

    t += Math.round((wave.intervalMs + rngInt(rng, -300, 300)) * scale.interval);
  }

  return words;
}

// ── Client-side word position ─────────────────────────────────────────

export function wordProgress(word: WordDef, gameElapsedMs: number): number {
  const elapsed = gameElapsedMs - word.spawnAt;
  if (elapsed < 0) return -1; // not yet spawned
  return Math.min(elapsed / word.fallDuration, 1);
}

export function isWordVisible(word: WordDef, gameElapsedMs: number): boolean {
  const p = wordProgress(word, gameElapsedMs);
  return p >= 0 && p < 1;
}

export function isWordMissed(word: WordDef, gameElapsedMs: number): boolean {
  return wordProgress(word, gameElapsedMs) >= 1;
}

// ── Scoring ───────────────────────────────────────────────────────────

export function wordScore(word: WordDef, combo: number): number {
  const lengthBonus = Math.max(1, word.text.length - 2);
  const comboMult   = 1 + Math.min(combo * 0.1, 3); // max 4× at combo 30
  return Math.round(10 * lengthBonus * comboMult);
}
