import PartySocket from 'partysocket';
import type { ClientMsg, ServerMsg } from './arena-types';
import { handleServerMessage, arenaReconnecting, arenaReconnectAttempt } from '@/store/arena';
import { collabPeerCount, collabConnected } from '@/store/collab';

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST as string ?? 'localhost:1999';

let socket: PartySocket | null = null;
let reconnectAttempts = 0;
let lastRoomId: string | null = null;
let currentSocketId = 0;

export function connectToRoom(roomId: string): void {
  lastRoomId = roomId;
  reconnectAttempts = 0;
  currentSocketId++;
  _doConnect(roomId, currentSocketId);
}

function _doConnect(roomId: string, expectedId: number): void {
  if (socket) {
    const s = socket;
    socket = null;
    s.close();
  }
  socket = new PartySocket({ host: PARTYKIT_HOST, room: roomId });

  socket.addEventListener('message', (evt: MessageEvent) => {
    if (currentSocketId !== expectedId) return;
    try {
      const msg = JSON.parse(evt.data) as ServerMsg;
      if (msg.type === 'welcome') {
        reconnectAttempts = 0;
        arenaReconnecting.value = false;
        arenaReconnectAttempt.value = 0;
      }
      handleServerMessage(msg);
    } catch { /* ignore malformed */ }
  });

  socket.addEventListener('close', () => {
    if (currentSocketId !== expectedId) return; // invalidated (new connect or intentional disconnect)
    if (!socket) return;                         // intentional close — socket was nulled first

    if (reconnectAttempts < 3 && lastRoomId) {
      reconnectAttempts++;
      arenaReconnecting.value = true;
      arenaReconnectAttempt.value = reconnectAttempts;
      const delay = Math.pow(2, reconnectAttempts - 1) * 1000; // 1s, 2s, 4s
      setTimeout(() => {
        if (currentSocketId === expectedId) {
          currentSocketId++;
          _doConnect(lastRoomId!, currentSocketId);
        }
      }, delay);
    } else {
      arenaReconnecting.value = false;
      arenaReconnectAttempt.value = 0;
      handleServerMessage({ type: 'error', code: 'ROOM_NOT_FOUND', message: 'Connection lost. Please rejoin.' });
    }
  });
}

export function connectToBrowse(): void {
  disconnectFromRoom();
  socket = new PartySocket({ host: PARTYKIT_HOST, room: '_lobby' });
  socket.addEventListener('message', (evt: MessageEvent) => {
    try {
      handleServerMessage(JSON.parse(evt.data) as ServerMsg);
    } catch { /* ignore */ }
  });
}

export function sendMsg(msg: ClientMsg): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(msg));
}

export function disconnectFromRoom(): void {
  currentSocketId++; // invalidate any pending reconnect timeouts
  if (socket) {
    const s = socket;
    socket = null;   // null first so 'close' handler sees intentional close
    s.close();
  }
  arenaReconnecting.value = false;
  arenaReconnectAttempt.value = 0;
}

// ── Writer-mode collab presence ───────────────────────────────────────

let collabSocket: PartySocket | null = null;
let presenceThrottle: ReturnType<typeof setTimeout> | null = null;

export function connectToCollab(docId: string): void {
  disconnectFromCollab();
  collabSocket = new PartySocket({ host: PARTYKIT_HOST, room: docId, party: 'collab' });
  collabConnected.value = true;
  collabSocket.addEventListener('message', (evt: MessageEvent) => {
    try {
      const msg = JSON.parse(evt.data) as { type: string; count?: number };
      if (msg.type === 'peer_count' && typeof msg.count === 'number') {
        collabPeerCount.value = msg.count;
      }
    } catch { /* ignore */ }
  });
  collabSocket.addEventListener('close', () => {
    collabConnected.value = false;
    collabPeerCount.value = 0;
  });
}

export function disconnectFromCollab(): void {
  if (presenceThrottle) { clearTimeout(presenceThrottle); presenceThrottle = null; }
  if (collabSocket) {
    const s = collabSocket;
    collabSocket = null;
    s.close();
  }
  collabConnected.value = false;
  collabPeerCount.value = 0;
}

export function sendPresence(scrollPct: number): void {
  if (!collabSocket || collabSocket.readyState !== WebSocket.OPEN) return;
  if (presenceThrottle) return;
  presenceThrottle = setTimeout(() => { presenceThrottle = null; }, 300);
  collabSocket.send(JSON.stringify({ scrollPct }));
}

export async function checkRoomExists(roomId: string): Promise<{ exists: boolean; phase?: string; playerCount?: number }> {
  try {
    const protocol = PARTYKIT_HOST.startsWith('localhost') ? 'http' : 'https';
    const res = await fetch(`${protocol}://${PARTYKIT_HOST}/party/${roomId}`, { method: 'GET' });
    if (!res.ok) return { exists: false };
    return await res.json() as { exists: boolean; phase?: string; playerCount?: number };
  } catch {
    return { exists: false };
  }
}
