// ── Persistent player stats, XP/levels, achievements, daily challenge ──
import { signal, computed } from '@preact/signals';

// ─── Types ────────────────────────────────────────────────────────────

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  bestWpm: number;
  avgAccuracy: number;             // rolling avg over last 20 games
  totalXp: number;
  recentAccuracies: number[];      // last 20
  recentWpms: number[];
  achievementsUnlocked: string[];
  ghostBestWpm: number;
  ghostBestAccuracy: number;
  ghostTypedSnapshot: string;      // the typed text for best WPM run
  dailyChallengeDate: string;      // YYYY-MM-DD
  dailyBestScore: number;
  dailyBestWpm: number;
  dailyLeaderboard: DailyEntry[];
  playerColor: string;
}

export interface DailyEntry {
  name: string;
  wpm: number;
  score: number;
  accuracy: number;
  ts: number;
}

export interface GameResult {
  wpm: number;
  accuracy: number;
  score: number;
  isWin: boolean;
  promptId: string;
}

// ─── Levels ───────────────────────────────────────────────────────────

export const LEVELS = [
  { min: 0,    title: 'Novice',       color: '#6b7280' },
  { min: 200,  title: 'Apprentice',   color: '#3b82f6' },
  { min: 600,  title: 'Scribe',       color: '#8b5cf6' },
  { min: 1200, title: 'Typist',       color: '#10b981' },
  { min: 2200, title: 'Wordsmith',    color: '#f59e0b' },
  { min: 3500, title: 'Journalist',   color: '#f97316' },
  { min: 5500, title: 'Speedster',    color: '#ef4444' },
  { min: 8000, title: 'Racer',        color: '#ec4899' },
  { min: 12000,title: 'Ace Typist',   color: '#f7df4b' },
  { min: 18000,title: 'Legend',       color: '#a78bfa' },
];

export function getLevel(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.min) level = l; else break; }
  return level;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; pct: number } {
  const idx = LEVELS.findIndex(l => xp < l.min);
  if (idx === -1) return { current: xp - LEVELS[LEVELS.length - 1].min, needed: 9999, pct: 1 };
  const prev = LEVELS[idx - 1]?.min ?? 0;
  const next = LEVELS[idx].min;
  const current = xp - prev;
  const needed  = next - prev;
  return { current, needed, pct: Math.min(1, current / needed) };
}

export function xpForGame(result: GameResult): number {
  const base = Math.round(result.score / 10);
  const winBonus = result.isWin ? 30 : 0;
  return base + winBonus;
}

// ─── Achievements ──────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (stats: PlayerStats, result?: GameResult) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game',   title: 'First Keystroke',  desc: 'Complete your first game.',                icon: '🎮', check: s => s.totalGames >= 1 },
  { id: 'first_win',    title: 'Winner Winner',    desc: 'Win your first multiplayer match.',         icon: '🏆', check: s => s.totalWins >= 1 },
  { id: 'speed_30',     title: 'Quick Fingers',    desc: 'Reach 30 WPM in any game.',                icon: '⚡', check: (_,r) => (r?.wpm ?? 0) >= 30 },
  { id: 'speed_60',     title: 'Speed Typist',     desc: 'Reach 60 WPM in any game.',                icon: '🚀', check: (_,r) => (r?.wpm ?? 0) >= 60 },
  { id: 'speed_100',    title: 'Supersonic',       desc: 'Reach 100 WPM in any game.',               icon: '🛸', check: (_,r) => (r?.wpm ?? 0) >= 100 },
  { id: 'perfect',      title: 'Flawless',         desc: 'Finish with 100% accuracy.',               icon: '💎', check: (_,r) => (r?.accuracy ?? 0) === 100 },
  { id: 'accurate_95',  title: 'Sharpshooter',     desc: 'Finish with ≥ 95% accuracy.',              icon: '🎯', check: (_,r) => (r?.accuracy ?? 0) >= 95 },
  { id: 'games_5',      title: 'Getting Started',  desc: 'Play 5 games.',                            icon: '📘', check: s => s.totalGames >= 5 },
  { id: 'games_25',     title: 'Dedicated',        desc: 'Play 25 games.',                           icon: '📗', check: s => s.totalGames >= 25 },
  { id: 'games_100',    title: 'Century Typist',   desc: 'Play 100 games.',                          icon: '📕', check: s => s.totalGames >= 100 },
  { id: 'wins_10',      title: 'Veteran',          desc: 'Win 10 multiplayer matches.',               icon: '🥇', check: s => s.totalWins >= 10 },
  { id: 'daily',        title: 'Daily Grinder',    desc: 'Complete the daily challenge.',             icon: '📅', check: s => s.dailyBestScore > 0 },
  { id: 'level_5',      title: 'Wordsmith',        desc: 'Reach Wordsmith level.',                   icon: '✍️', check: s => s.totalXp >= 2200 },
  { id: 'legend',       title: 'Living Legend',    desc: 'Reach Legend level.',                      icon: '👑', check: s => s.totalXp >= 18000 },
  { id: 'beat_ghost',   title: 'Ghost Slayer',     desc: 'Beat your own personal best in solo mode.',icon: '👻', check: (_,r) => !!(r as GameResult & { beatGhost?: boolean })?.beatGhost },
];

// ─── Storage ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'm4rkdown_arena_stats_v1';

function defaultStats(): PlayerStats {
  return {
    totalGames: 0, totalWins: 0, bestWpm: 0,
    avgAccuracy: 100, totalXp: 0,
    recentAccuracies: [], recentWpms: [],
    achievementsUnlocked: [],
    ghostBestWpm: 0, ghostBestAccuracy: 0, ghostTypedSnapshot: '',
    dailyChallengeDate: '', dailyBestScore: 0, dailyBestWpm: 0,
    dailyLeaderboard: [],
    playerColor: '#f7df4b',
  };
}

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    return { ...defaultStats(), ...JSON.parse(raw) as Partial<PlayerStats> };
  } catch { return defaultStats(); }
}

function saveStats(s: PlayerStats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* storage full */ }
}

// ─── Signals ──────────────────────────────────────────────────────────

export const playerStats = signal<PlayerStats>(loadStats());

export const playerLevel   = computed(() => getLevel(playerStats.value.totalXp));
export const playerXpInfo  = computed(() => xpToNextLevel(playerStats.value.totalXp));

// ─── Actions ──────────────────────────────────────────────────────────

export function recordGame(result: GameResult): string[] {
  const s = { ...playerStats.value };
  s.totalGames++;
  if (result.isWin) s.totalWins++;
  if (result.wpm > s.bestWpm) s.bestWpm = result.wpm;

  s.recentAccuracies = [...s.recentAccuracies.slice(-19), result.accuracy];
  s.recentWpms       = [...s.recentWpms.slice(-19), result.wpm];
  s.avgAccuracy      = Math.round(s.recentAccuracies.reduce((a,b) => a+b, 0) / s.recentAccuracies.length);

  const xpEarned = xpForGame(result);
  s.totalXp += xpEarned;

  // Check achievements
  const newlyUnlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!s.achievementsUnlocked.includes(a.id) && a.check(s, result)) {
      s.achievementsUnlocked.push(a.id);
      newlyUnlocked.push(a.id);
    }
  }

  playerStats.value = s;
  saveStats(s);
  return newlyUnlocked;
}

export function recordSoloGhost(wpm: number, accuracy: number, typedSnapshot: string) {
  const s = { ...playerStats.value };
  if (wpm > s.ghostBestWpm) {
    s.ghostBestWpm = wpm;
    s.ghostBestAccuracy = accuracy;
    s.ghostTypedSnapshot = typedSnapshot;
    playerStats.value = s;
    saveStats(s);
  }
}

export function recordDailyScore(name: string, wpm: number, score: number, accuracy: number) {
  const today = todayStr();
  const s = { ...playerStats.value };

  if (s.dailyChallengeDate !== today) {
    s.dailyChallengeDate = today;
    s.dailyBestScore = 0;
    s.dailyBestWpm = 0;
    s.dailyLeaderboard = [];
  }

  if (score > s.dailyBestScore) {
    s.dailyBestScore = score;
    s.dailyBestWpm = wpm;
  }

  const existing = s.dailyLeaderboard.findIndex(e => e.name === name);
  const entry: DailyEntry = { name, wpm, score, accuracy, ts: Date.now() };
  if (existing >= 0 && s.dailyLeaderboard[existing].score < score) {
    s.dailyLeaderboard[existing] = entry;
  } else if (existing === -1) {
    s.dailyLeaderboard.push(entry);
  }
  s.dailyLeaderboard.sort((a,b) => b.score - a.score);
  s.dailyLeaderboard = s.dailyLeaderboard.slice(0, 10);

  playerStats.value = s;
  saveStats(s);
}

export function setPlayerColor(color: string) {
  const s = { ...playerStats.value, playerColor: color };
  playerStats.value = s;
  saveStats(s);
}

// ─── Daily Challenge ──────────────────────────────────────────────────

import { ARENA_PROMPTS } from '@/lib/arena-prompts';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyPrompt() {
  const dateNum = parseInt(todayStr().replace(/-/g, ''), 10);
  const idx = dateNum % ARENA_PROMPTS.length;
  return ARENA_PROMPTS[idx];
}
