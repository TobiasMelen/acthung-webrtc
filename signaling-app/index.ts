import io from "socket.io";

const socketServer = io(process.env.PORT ?? 8080, {
  serveClient: false
});

socketServer.on("connect", socket => {
  const { hostLobby, joinLobby } = socket.handshake.query;
  if (hostLobby) {
    socket.join(hostLobby);
  } else if (joinLobby == null || !(joinLobby in socketServer.sockets.adapter.rooms)) {
    socket.send("error", { reason: "EMPTY_ROOM" });
    socket.disconnect();
    return;
  }
  socket.on("message", ({to, ...data}: any) => {
    const dataWithSender = { ...data, from: socket.id };
    if (to) {
      socket.to(to).send(dataWithSender);
    } else {
      socket.broadcast.emit("message", dataWithSender);
    }
  });
});
