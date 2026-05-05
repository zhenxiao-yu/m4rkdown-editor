import type * as Party from 'partykit/server';

interface PresenceMsg { type: 'presence'; peerId: string; scrollPct: number; }
interface PeerCountMsg { type: 'peer_count'; count: number; }

type CollabMsg = PresenceMsg | PeerCountMsg;

export default class CollabServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const count = [...this.room.getConnections()].length;
    conn.send(JSON.stringify({ type: 'peer_count', count } satisfies CollabMsg));
    this.room.broadcast(JSON.stringify({ type: 'peer_count', count } satisfies CollabMsg), [conn.id]);
  }

  onMessage(raw: string, conn: Party.Connection) {
    try {
      const msg = JSON.parse(raw) as { scrollPct?: number };
      if (typeof msg.scrollPct === 'number') {
        const out: PresenceMsg = { type: 'presence', peerId: conn.id, scrollPct: msg.scrollPct };
        this.room.broadcast(JSON.stringify(out), [conn.id]);
      }
    } catch { /* ignore malformed */ }
  }

  onClose() {
    const count = Math.max(0, [...this.room.getConnections()].length - 1);
    this.room.broadcast(JSON.stringify({ type: 'peer_count', count } satisfies CollabMsg));
  }
}
