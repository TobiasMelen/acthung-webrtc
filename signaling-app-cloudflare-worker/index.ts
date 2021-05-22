addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request) {
  const upgradeHeader = request.headers.get("Upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const [client, server] = Object.values(new WebSocketPair()) as [
    WebSocket,
    WebSocket
  ];

  await handleSession(server);

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

function handleSession(server: WebSocket) {
  throw new Error("Function not implemented!");
}
