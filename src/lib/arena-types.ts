// ── Glyphica Survival — shared protocol types ─────────────────────────

import type { WordDef } from './game-engine';

export type { WordDef };

// ── Shared data shapes ────────────────────────────────────────────────

export interface SurvivalPlayer {
  id: string;
  name: string;
  color: string;          // hex, chosen at join
  hp: number;             // 5 max
  score: number;
  combo: number;
  wordsTyped: number;
  alive: boolean;
  deathOrder: number | null;  // 1 = first to die, null = still alive
}

export interface PublicRoomInfo {
  roomId: string;
  hostName: string;
  playerCount: number;
  status: 'lobby' | 'playing';
}

// ── Client → Server ───────────────────────────────────────────────────

export type ClientMsg =
  | { type: 'join';         playerName: string; roomId: string; color: string; isHost: boolean; customWords?: string }
  | { type: 'start' }
  | { type: 'claim_word';   wordId: string }
  | { type: 'word_done';    wordId: string; combo: number }
  | { type: 'word_missed';  wordId: string }
  | { type: 'publish' }
  | { type: 'browse' };

// ── Server → Client ───────────────────────────────────────────────────

export type ServerMsg =
  | { type: 'welcome';       playerId: string; roomId: string; isPublic: boolean }
  | { type: 'roster';        players: SurvivalPlayer[]; hostId: string }
  | { type: 'countdown';     startsAt: number }
  | { type: 'game_start';    seed: number; startTime: number; wordQueue: WordDef[] }
  | { type: 'word_claimed';  wordId: string; playerId: string }
  | { type: 'word_destroyed';wordId: string; playerId: string; score: number; combo: number }
  | { type: 'word_missed';   wordId: string }
  | { type: 'scores';        players: SurvivalPlayer[] }
  | { type: 'player_dead';   playerId: string; deathOrder: number; finalScore: number }
  | { type: 'game_over';     players: SurvivalPlayer[]; survivorId: string | null }
  | { type: 'error';         code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'GAME_IN_PROGRESS' | 'NAME_TAKEN'; message: string }
  | { type: 'room_list';     rooms: PublicRoomInfo[] };
