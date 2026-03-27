const clients = new Set();

const server = Bun.serve({
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/" || url.pathname === "index.html") {
      return new Response(Bun.file("index.html"));
    }
    if (req.headers.get("upgrade") === "websocket") {
      const success = server.upgrade(req);
      if (success) return;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    if (url.pathname === "/script.js") {
      return new Response(Bun.file("script.js"), {
        headers: { "Content-Type": "text/javascript" },
      });
    }
    if (url.pathname === "/style.css") {
      return new Response(Bun.file("style.css"), {
        headers: { "Content-Type": "text/css" },
      });
    }
    if (url.pathname === "/chat" || url.pathname === "/chat.html") {
      return new Response(Bun.file("chat.html"));
    }

    return new Response("Not Found", { status: 404 });
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

