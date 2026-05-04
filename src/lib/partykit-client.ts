import PartySocket from 'partysocket';
import type { ClientMsg, ServerMsg } from './arena-types';
import { handleServerMessage } from '@/store/arena';

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST as string ?? 'localhost:1999';

let socket: PartySocket | null = null;

export function connectToRoom(roomId: string): void {
  disconnectFromRoom();
  socket = new PartySocket({ host: PARTYKIT_HOST, room: roomId });
  socket.addEventListener('message', (evt: MessageEvent) => {
    try {
      handleServerMessage(JSON.parse(evt.data) as ServerMsg);
    } catch { /* ignore malformed */ }
  });
  socket.addEventListener('close', () => {
    // Only error if we're mid-session (not after an intentional close)
    if (socket) {
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
  if (socket) {
    const s = socket;
    socket = null;   // null first so 'close' handler doesn't fire error
    s.close();
  }
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
