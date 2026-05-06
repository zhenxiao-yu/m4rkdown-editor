import { signal, computed, batch } from '@preact/signals';
import type { SurvivalPlayer, PublicRoomInfo, ServerMsg } from '@/lib/arena-types';
import type { WordDef } from '@/lib/game-engine';

// ── View ──────────────────────────────────────────────────────────────

export type ArenaView = 'closed' | 'home' | 'lobby' | 'countdown' | 'game' | 'results';
export const arenaView = signal<ArenaView>('closed');

// ── Room / Identity ───────────────────────────────────────────────────

export const arenaRoomId     = signal<string>('');
export const arenaPlayerId   = signal<string>('');
export const arenaPlayerName = signal<string>('');
export const arenaPlayerColor= signal<string>('#f7df4b');
export const arenaIsHost     = signal<boolean>(false);
export const arenaIsPublic   = signal<boolean>(false);

// ── Roster ────────────────────────────────────────────────────────────

export const arenaPlayers    = signal<SurvivalPlayer[]>([]);
export const arenaHostId     = signal<string>('');
export const arenaMyPlayer   = computed(() =>
  arenaPlayers.value.find(p => p.id === arenaPlayerId.value) ?? null
);

// ── Timing ────────────────────────────────────────────────────────────

export const arenaCountdownT    = signal<number>(3);
export const arenaGameStartAt   = signal<number | null>(null); // epoch ms countdown target
export const arenaGameStartedAt = signal<number | null>(null); // epoch ms game actually began

// ── Game state (survival) ─────────────────────────────────────────────

export const arenaWordQueue     = signal<WordDef[]>([]);
export const arenaSeed          = signal<number>(0);

// Words actively claimed by any player this session
// wordId → playerId
export const arenaClaimedWords  = signal<Map<string, string>>(new Map());
// Words destroyed this session
export const arenaDestroyedWords= signal<Set<string>>(new Set());
// Words missed (fell off screen) this session
export const arenaMissedWords   = signal<Set<string>>(new Set());

// ── Browse ────────────────────────────────────────────────────────────

export const arenaPublicRooms   = signal<PublicRoomInfo[]>([]);

// ── Status ────────────────────────────────────────────────────────────

export const arenaError             = signal<string | null>(null);
export const arenaConnecting        = signal<boolean>(false);
export const arenaReconnecting      = signal<boolean>(false);
export const arenaReconnectAttempt  = signal<number>(0);

// ── Results ───────────────────────────────────────────────────────────

export const arenaFinalPlayers  = signal<SurvivalPlayer[]>([]);
export const arenaSurvivorId    = signal<string | null>(null);

// ── Actions ──────────────────────────────────────────────────────────

export function openArena(): void {
  arenaView.value = 'home';
  arenaError.value = null;
}

export function closeArena(): void {
  import('@/lib/partykit-client').then(({ disconnectFromRoom }) => disconnectFromRoom());
  batch(() => {
    arenaView.value          = 'closed';
    arenaRoomId.value        = '';
    arenaPlayerId.value      = '';
    arenaPlayerName.value    = '';
    arenaIsHost.value        = false;
    arenaIsPublic.value      = false;
    arenaPlayers.value       = [];
    arenaHostId.value        = '';
    arenaGameStartAt.value   = null;
    arenaGameStartedAt.value = null;
    arenaCountdownT.value    = 3;
    arenaWordQueue.value     = [];
    arenaClaimedWords.value  = new Map();
    arenaDestroyedWords.value= new Set();
    arenaMissedWords.value   = new Set();
    arenaFinalPlayers.value  = [];
    arenaSurvivorId.value    = null;
    arenaError.value             = null;
    arenaConnecting.value        = false;
    arenaReconnecting.value      = false;
    arenaReconnectAttempt.value  = 0;
  });
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'M4-';
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function tickCountdown(): boolean {
  if (!arenaGameStartAt.value) return false;
  const remaining = Math.ceil((arenaGameStartAt.value - Date.now()) / 1000);
  arenaCountdownT.value = Math.max(0, remaining);
  return remaining <= 0;
}

// ── Server message dispatcher ─────────────────────────────────────────

export function handleServerMessage(msg: ServerMsg): void {
  switch (msg.type) {

    case 'welcome':
      batch(() => {
        arenaPlayerId.value   = msg.playerId;
        arenaRoomId.value     = msg.roomId;
        arenaIsPublic.value   = msg.isPublic;
        arenaView.value       = 'lobby';
        arenaConnecting.value = false;
        arenaError.value      = null;
      });
      break;

    case 'roster':
      batch(() => {
        arenaPlayers.value = msg.players;
        arenaHostId.value  = msg.hostId;
        arenaIsHost.value  = msg.hostId === arenaPlayerId.value;
      });
      break;

    case 'host_changed':
      arenaHostId.value  = msg.newHostId;
      arenaIsHost.value  = msg.newHostId === arenaPlayerId.value;
      break;

    case 'countdown':
      batch(() => {
        arenaGameStartAt.value = msg.startsAt;
        arenaView.value        = 'countdown';
      });
      break;

    case 'game_start':
      batch(() => {
        arenaSeed.value          = msg.seed;
        arenaGameStartedAt.value = msg.startTime;
        arenaWordQueue.value     = msg.wordQueue;
        arenaClaimedWords.value  = new Map();
        arenaDestroyedWords.value= new Set();
        arenaMissedWords.value   = new Set();
        arenaView.value          = 'game';
      });
      break;

    case 'word_claimed': {
      const next = new Map(arenaClaimedWords.value);
      next.set(msg.wordId, msg.playerId);
      arenaClaimedWords.value = next;
      break;
    }

    case 'word_destroyed': {
      const claimed = new Map(arenaClaimedWords.value);
      const destroyed = new Set(arenaDestroyedWords.value);
      claimed.delete(msg.wordId);
      destroyed.add(msg.wordId);
      arenaClaimedWords.value   = claimed;
      arenaDestroyedWords.value = destroyed;
      break;
    }

    case 'word_missed': {
      const missed = new Set(arenaMissedWords.value);
      missed.add(msg.wordId);
      arenaMissedWords.value = missed;
      break;
    }

    case 'scores':
      arenaPlayers.value = msg.players;
      break;

    case 'player_dead':
      arenaPlayers.value = arenaPlayers.value.map(p =>
        p.id === msg.playerId
          ? { ...p, alive: false, deathOrder: msg.deathOrder, hp: 0 }
          : p
      );
      break;

    case 'game_over':
      batch(() => {
        arenaFinalPlayers.value = msg.players;
        arenaSurvivorId.value   = msg.survivorId;
        arenaPlayers.value      = msg.players;
        arenaView.value         = 'results';
      });
      break;

    case 'error':
      batch(() => {
        arenaError.value      = msg.message;
        arenaConnecting.value = false;
      });
      break;

    case 'room_list':
      arenaPublicRooms.value = msg.rooms;
      break;
  }
}
