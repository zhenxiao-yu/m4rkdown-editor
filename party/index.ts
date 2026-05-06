import type * as Party from 'partykit/server';
import type { ClientMsg, ServerMsg, SurvivalPlayer, PublicRoomInfo } from '../src/lib/arena-types';
import { generateWordQueue } from '../src/lib/game-engine';

const MAX_PLAYERS    = 8;
const COUNTDOWN_MS   = 3_000;
const PLAYER_HP      = 5;

type Phase = 'lobby' | 'countdown' | 'playing' | 'game_over';

interface DisconnectedPlayer {
  player:  SurvivalPlayer;
  leftAt:  number;
  prevId:  string; // conn.id at time of disconnect
}

interface RoomState {
  phase:          Phase;
  hostId:         string;
  isPublic:       boolean;
  players:        Map<string, SurvivalPlayer>;
  completedWords: Set<string>;
  missedWords:    Set<string>;
  claimedWords:   Map<string, string>; // wordId → playerId
  seed:           number;
  startTime:      number | null;
  deathCount:     number;
  gameTimeout:    ReturnType<typeof setTimeout> | null;
  customWordsB64: string | null;
  recentlyLeft:   Map<string, DisconnectedPlayer>; // name → state, for reconnect window
}

// ── Helpers ───────────────────────────────────────────────────────────

function send(conn: Party.Connection, msg: ServerMsg) {
  conn.send(JSON.stringify(msg));
}
function broadcast(room: Party.Room, msg: ServerMsg, exclude?: string) {
  room.broadcast(JSON.stringify(msg), exclude ? [exclude] : []);
}
function broadcastAll(room: Party.Room, msg: ServerMsg) {
  room.broadcast(JSON.stringify(msg));
}

function rosterMsg(state: RoomState): ServerMsg {
  return { type: 'roster', players: [...state.players.values()], hostId: state.hostId };
}

function scoresMsg(state: RoomState): ServerMsg {
  return { type: 'scores', players: [...state.players.values()] };
}

// ── Game room ─────────────────────────────────────────────────────────

export default class SurvivalRoom implements Party.Server {
  state: RoomState;

  constructor(readonly room: Party.Room) {
    this.state = {
      phase: 'lobby', hostId: '', isPublic: false,
      players: new Map(), completedWords: new Set(),
      missedWords: new Set(), claimedWords: new Map(),
      seed: Math.floor(Math.random() * 0xFFFFFF),
      startTime: null, deathCount: 0, gameTimeout: null, customWordsB64: null,
      recentlyLeft: new Map(),
    };
  }

  onConnect(conn: Party.Connection) {
    send(conn, rosterMsg(this.state));
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: ClientMsg;
    try { msg = JSON.parse(raw) as ClientMsg; } catch { return; }

    switch (msg.type) {
      case 'join':        this.handleJoin(msg, conn); break;
      case 'start':       this.handleStart(conn); break;
      case 'claim_word':  this.handleClaim(msg, conn); break;
      case 'word_done':   this.handleWordDone(msg, conn); break;
      case 'word_missed': this.handleWordMissed(msg, conn); break;
      case 'publish':     this.handlePublish(conn); break;
    }
  }

  onClose(conn: Party.Connection) {
    const { state } = this;
    const player = state.players.get(conn.id);
    if (!player) return;

    // Preserve state for 30-second reconnect window during active game
    if (state.phase === 'playing') {
      state.recentlyLeft.set(player.name, { player: { ...player }, leftAt: Date.now(), prevId: conn.id });
    }

    state.players.delete(conn.id);

    if (state.hostId === conn.id) {
      const next = [...state.players.values()][0];
      if (!next) { broadcastAll(this.room, rosterMsg(state)); return; }
      state.hostId = next.id;
      // Notify the new host explicitly so their client sets arenaIsHost
      const newHostConn = this.room.getConnection(next.id);
      if (newHostConn) send(newHostConn, { type: 'host_changed', newHostId: next.id });
    }

    if (state.phase === 'playing') this.checkGameOver();
    broadcastAll(this.room, rosterMsg(state));
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === 'GET') {
      const { state } = this;
      return Response.json({ exists: state.players.size > 0, phase: state.phase, playerCount: state.players.size });
    }
    return new Response('ok');
  }

  // ── Handlers ─────────────────────────────────────────────────────────

  private handleJoin(msg: Extract<ClientMsg, { type: 'join' }>, conn: Party.Connection) {
    const { state } = this;

    // ── Rejoin: player reconnecting within the 30-second window ──────────
    const prev = state.recentlyLeft.get(msg.playerName);
    if (prev && Date.now() - prev.leftAt < 30_000) {
      state.recentlyLeft.delete(msg.playerName);
      const restored: SurvivalPlayer = { ...prev.player, id: conn.id };
      state.players.set(conn.id, restored);
      if (state.hostId === prev.prevId) state.hostId = conn.id;
      send(conn, { type: 'welcome', playerId: conn.id, roomId: msg.roomId, isPublic: state.isPublic });
      // Resend game state so the reconnecting client can resume
      if (state.phase === 'playing' && state.startTime !== null) {
        let customWords: string[] | undefined;
        if (state.customWordsB64) {
          try { customWords = atob(state.customWordsB64).split(',').filter(Boolean); } catch { /* ignore */ }
        }
        send(conn, { type: 'game_start', seed: state.seed, startTime: state.startTime, wordQueue: generateWordQueue(state.seed, customWords) });
      }
      broadcastAll(this.room, rosterMsg(state));
      return;
    }

    // Clean up stale reconnect slots
    const now = Date.now();
    for (const [name, d] of state.recentlyLeft) {
      if (now - d.leftAt > 30_000) state.recentlyLeft.delete(name);
    }

    // ── Regular join ──────────────────────────────────────────────────────
    if (state.players.size >= MAX_PLAYERS) {
      send(conn, { type: 'error', code: 'ROOM_FULL', message: `Room is full — ${MAX_PLAYERS} players max. Ask the host to start a new room.` }); return;
    }
    if (state.phase !== 'lobby') {
      send(conn, { type: 'error', code: 'GAME_IN_PROGRESS', message: 'A game is already in progress. Wait for it to finish or ask the host for a new code.' }); return;
    }

    const nameTaken = [...state.players.values()].some(p => p.name === msg.playerName);
    if (nameTaken) {
      send(conn, { type: 'error', code: 'NAME_TAKEN', message: `The name "${msg.playerName}" is already taken in this room. Try a different name.` }); return;
    }

    if (msg.isHost && !state.hostId) {
      state.hostId = conn.id;
      if (msg.customWords) state.customWordsB64 = msg.customWords;
    }

    const player: SurvivalPlayer = {
      id: conn.id, name: msg.playerName, color: msg.color,
      hp: PLAYER_HP, score: 0, combo: 0,
      wordsTyped: 0, alive: true, deathOrder: null,
    };
    state.players.set(conn.id, player);

    send(conn, { type: 'welcome', playerId: conn.id, roomId: msg.roomId, isPublic: state.isPublic });
    broadcastAll(this.room, rosterMsg(state));
  }

  private handleStart(conn: Party.Connection) {
    const { state } = this;
    if (conn.id !== state.hostId || state.phase !== 'lobby') return;
    if (state.players.size < 1) return;

    state.phase = 'countdown';
    const startsAt = Date.now() + COUNTDOWN_MS;
    broadcastAll(this.room, { type: 'countdown', startsAt });

    setTimeout(() => {
      state.phase     = 'playing';
      state.startTime = Date.now();
      let customWords: string[] | undefined;
      if (state.customWordsB64) {
        try { customWords = atob(state.customWordsB64).split(',').filter(Boolean); } catch { /* ignore bad b64 */ }
      }
      const wordQueue = generateWordQueue(state.seed, customWords);

      broadcastAll(this.room, {
        type: 'game_start',
        seed: state.seed,
        startTime: state.startTime,
        wordQueue,
      });

      // 8-minute hard cap
      state.gameTimeout = setTimeout(() => this.endGame(), 8 * 60_000);
    }, COUNTDOWN_MS);
  }

  private handleClaim(msg: Extract<ClientMsg, { type: 'claim_word' }>, conn: Party.Connection) {
    const { state } = this;
    if (state.phase !== 'playing') return;
    const p = state.players.get(conn.id);
    if (!p?.alive || state.completedWords.has(msg.wordId)) return;

    // First-come-first-served
    if (!state.claimedWords.has(msg.wordId)) {
      state.claimedWords.set(msg.wordId, conn.id);
      broadcastAll(this.room, { type: 'word_claimed', wordId: msg.wordId, playerId: conn.id });
    }
  }

  private handleWordDone(msg: Extract<ClientMsg, { type: 'word_done' }>, conn: Party.Connection) {
    const { state } = this;
    if (state.phase !== 'playing') return;
    if (state.completedWords.has(msg.wordId)) return;

    const p = state.players.get(conn.id);
    if (!p?.alive) return;

    state.completedWords.add(msg.wordId);
    state.claimedWords.delete(msg.wordId);

    p.wordsTyped++;
    p.combo = msg.combo;

    // Score: length-based + combo multiplier
    const wordLen = 4; // server doesn't store word text; client sent combo for score calc
    const score = Math.round(10 * (1 + Math.min(msg.combo * 0.1, 3)));
    p.score += score;

    broadcastAll(this.room, { type: 'word_destroyed', wordId: msg.wordId, playerId: conn.id, score, combo: msg.combo });
    broadcastAll(this.room, scoresMsg(state));
  }

  private handleWordMissed(msg: Extract<ClientMsg, { type: 'word_missed' }>, conn: Party.Connection) {
    const { state } = this;
    if (state.phase !== 'playing') return;
    if (state.missedWords.has(msg.wordId)) return; // already processed

    state.missedWords.add(msg.wordId);
    state.claimedWords.delete(msg.wordId);

    // Only the reporting player loses HP (individual HP model)
    const p = state.players.get(conn.id);
    if (!p?.alive) return;

    p.combo = 0;
    p.hp = Math.max(0, p.hp - 1);

    broadcastAll(this.room, { type: 'word_missed', wordId: msg.wordId });
    broadcastAll(this.room, scoresMsg(state));

    if (p.hp === 0) this.killPlayer(conn.id);
  }

  private handlePublish(conn: Party.Connection) {
    if (conn.id !== this.state.hostId) return;
    this.state.isPublic = true;
    this.notifyLobby();
  }

  private killPlayer(playerId: string) {
    const { state } = this;
    const p = state.players.get(playerId);
    if (!p || !p.alive) return;

    state.deathCount++;
    p.alive = false;
    p.deathOrder = state.deathCount;

    broadcastAll(this.room, { type: 'player_dead', playerId, deathOrder: state.deathCount, finalScore: p.score });

    this.checkGameOver();
  }

  private checkGameOver() {
    const alive = [...this.state.players.values()].filter(p => p.alive);
    if (alive.length <= 1) this.endGame();
  }

  private endGame() {
    const { state, room } = this;
    if (state.gameTimeout) { clearTimeout(state.gameTimeout); state.gameTimeout = null; }
    if (state.phase === 'game_over') return;
    state.phase = 'game_over';

    const alive = [...state.players.values()].filter(p => p.alive);
    const survivorId = alive[0]?.id ?? null;
    if (survivorId) {
      const s = state.players.get(survivorId)!;
      s.deathOrder = null; // explicitly mark as survivor
    }

    broadcastAll(room, { type: 'game_over', players: [...state.players.values()], survivorId });
    this.notifyLobby();
  }

  private async notifyLobby() {
    const { state, room } = this;
    if (!state.isPublic) return;
    try {
      const lobbyRoom = room.context.parties.main.get('_lobby');
      const info: PublicRoomInfo = {
        roomId: room.id,
        hostName: [...state.players.values()][0]?.name ?? 'Host',
        playerCount: state.players.size,
        status: state.phase === 'playing' ? 'playing' : 'lobby',
      };
      await lobbyRoom.fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          state.phase === 'game_over'
            ? { type: 'remove', roomId: room.id }
            : { type: 'upsert', room: info }
        ),
      });
    } catch { /* best-effort */ }
  }
}

// ── Lobby meta-room ───────────────────────────────────────────────────

export class LobbyServer implements Party.Server {
  rooms = new Map<string, PublicRoomInfo>();
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'room_list', rooms: [...this.rooms.values()] } satisfies ServerMsg));
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === 'POST') {
      try {
        const body = await req.json() as { type: 'upsert' | 'remove'; roomId?: string; room?: PublicRoomInfo };
        if (body.type === 'upsert' && body.room) {
          this.rooms.set(body.room.roomId, body.room);
        } else if (body.type === 'remove' && body.roomId) {
          this.rooms.delete(body.roomId);
        }
        this.room.broadcast(JSON.stringify({ type: 'room_list', rooms: [...this.rooms.values()] } satisfies ServerMsg));
      } catch { /* ignore */ }
    }
    return new Response('ok');
  }

  onMessage() {}
  onClose() {}
}
