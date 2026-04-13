export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/chat') {
      if (request.headers.get('Upgrade') === 'websocket') {
        const roomName = 'global';
        const id = env.ROOM.idFromName(roomName);
        const room = env.ROOM.get(id);
        return room.fetch(request);
      }

      // Serve chat HTML inline (or you could keep it separate)
      return new Response(chatHTML, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

// ----- Durable Object -----
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

const chatHTML = `<!DOCTYPE html>
<html>
  <head>
    <title>WebSocket Chat</title>
    <style>
      body { font-family: sans-serif; margin: 20px; }
      #messages { border: 1px solid #ccc; height: 300px; overflow-y: auto; padding: 10px; margin-bottom: 10px; }
      #message-input { width: 80%; padding: 5px; }
      button { padding: 5px 10px; }
    </style>
  </head>
  <body>
    <a href="/">home</a>
    <h1>WebSocket Chat</h1>
    <div id="status">Connecting...</div>
    <div id="messages"></div>
    <input type="text" id="message-input" placeholder="Type a message...">
    <button id="send">Send</button>

    <script>
      const ws = new WebSocket(\`ws://chat.bsgada.workers.dev/chat\`);
      const statusDiv = document.getElementById('status');
      const messagesDiv = document.getElementById('messages');
      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send');

      ws.onopen = () => {
        statusDiv.textContent = 'Connected';
      };

      ws.onmessage = (event) => {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = event.data;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      };

      ws.onclose = () => {
        statusDiv.textContent = 'Disconnected';
      };

      function sendMessage() {
        const text = input.value.trim();
        if (text && ws.readyState === WebSocket.OPEN) {
          ws.send(text);
          input.value = '';
        }
      }

      sendBtn.onclick = sendMessage;
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    </script>
  </body>
</html>`;

