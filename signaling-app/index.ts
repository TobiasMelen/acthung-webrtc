import io from "socket.io";

const socketServer = io(process.env.PORT ?? 8080, {
  serveClient: false
});

socketServer.on("connect", socket => {
  const { hostLobby, joinLobby, from } = socket.handshake.query;
  if (hostLobby) {
    if(hostLobby in socketServer.sockets.adapter.rooms){
      socket.send("error", {reason: "ALREADY_HOSTED"});
      socket.disconnect();
      return;
    }
    socket.join(hostLobby);
  } else if (joinLobby == null || !(joinLobby in socketServer.sockets.adapter.rooms)) {
    socket.send("error", { reason: "EMPTY_ROOM" });
    socket.disconnect();
    return;
  }
  if(from){
    socket.join(from);
  }
  socket.on("message", ({to, from, ...data}: any) => {
    const dataWithSender = { ...data, from: from ?? socket.id };
    if (to) {
      socket.to(to).send(dataWithSender);
    } else {
      socket.broadcast.emit("message", dataWithSender);
    }
  });
});