import index from './index.html';

const server = Bun.serve({
  static: {
    "/": index,
  },
  async fetch(req) {
    return new Response("Not Found", { status: 404 });
  }
});

console.log(`Server running at ${server.url}`);

