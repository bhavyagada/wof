export class Chat {
  constructor(state, env) {
    this.sessions = new Map();
    this.state = state;
  }

  async fetch(request) {
    try {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      this.sessions.set(server, { id: crypto.randomUUID() });
      this.state.acceptWebSocket(server);
      
      return new Response(null, { status: 101, webSocket: client });
    } catch (err) {
      console.error('Durable Object fetch error:', err);
      return new Response(`WebSocket upgrade failed: ${err.message}`, { status: 500 });
    }
  }

  async webSocketMessage(ws, message) {
    // Broadcast to all others in the room
    for (const [other] of this.sessions.entries()) {
      if (other !== ws) {
        other.send(message);
      }
    }
  }

  async webSocketClose(ws) {
    this.sessions.delete(ws);
  }
}

