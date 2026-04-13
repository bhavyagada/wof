export async function onRequest(context) {
  return fetch(new Request("https://chat.bsgada.workers.dev/chat", context.request));
}

