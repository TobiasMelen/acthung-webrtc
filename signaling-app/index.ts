import io from "socket.io";
import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(404, "Try websocket.");
  res.end("sorry");
});

const socketServer = io(server, {
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

server.listen(process.env.PORT ?? 8080);