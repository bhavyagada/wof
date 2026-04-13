const clients = new Set();

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    if (req.headers.get("upgrade") === "websocket") {
      const success = server.upgrade(req);
      if (success) return;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    return new Response("WebSocket server running", { status: 200 });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log(`Client connected! Total clients: ${clients.size}`);
    },
    message(ws, message) {
      console.log(`Received: ${message}`);
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    },
    close(ws) {
      clients.delete(ws);
      console.log(`Client disconnected! Total clients: ${clients.size}`);
    }
  }
});

console.log(`Server running at ${server.url}`);

