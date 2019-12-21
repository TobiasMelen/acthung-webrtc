import io from "socket.io";

const socketServer = io(process.env.PORT ?? 8080);

socketServer.on("connect", () => {
    console.log("connect triggered");
})

socketServer.on("connection", (ss) => {
    console.log("connection triggered");
})

