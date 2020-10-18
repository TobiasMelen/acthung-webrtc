//node imports
const http = require("http");
const url = require("url");
/**@type {import("redis")} */
const redis = require(process.env.NODE_ENV === "development"
  ? "redis-mock"
  : "redis");
const { promisify } = require("util");
const WebsocketServer = require("ws").Server;

//Connect to fly.io redis instance.
const redisClient = redis.createClient({
  db: 0,
  url: process.env.FLY_REDIS_CACHE_URL,
});
const pubsubClient = redisClient.duplicate();

const incrementRedisValue = promisify(redisClient.incr).bind(redisClient);
const setRedisValue = promisify(redisClient.set).bind(redisClient);

/** @param {string} channel @param {(messages: string) => any} handler */
const onMessageToPubSubChannel = (channel, handler) =>
  pubsubClient.on("message", (channelName, message) => {
    channelName === channel && handler(message);
  });

/**@param {import("ws")} ws*/
const getSocketCloseAndThrow = (ws) =>
  /** @param {string} error */
  (error, errorCode = 1008) => {
    ws.close(errorCode, error);
    throw error;
  };

/**
 * @param {string} channel
 * @param {(msg: string) => void} onMessage
 */
const setupPubSubSubscriber = (channel, onMessage) => {
  /** @type {[string, (msg: string) => void]} */
  const pubsubParams = [channel, onMessage];
  onMessageToPubSubChannel(...pubsubParams);
  pubsubClient.subscribe(pubsubParams[0]);
  return () => {
    pubsubClient.off(...pubsubParams);
    pubsubClient.unsubscribe(pubsubParams[0]);
  };
};
/**
 * @template {any[]} TParams
 * @param {(...params: TParams) => Promise<any>} inner*/
const catchAsyncErrs = (inner) =>
  /**@param {TParams} params*/
  (...params) => inner(...params).catch(console.error);

const server = http.createServer((req, res) =>
  res.writeHead(415, "Only websocket connections are supported").end()
);
const wss = new WebsocketServer({ server });

wss.on(
  "connection",
  catchAsyncErrs(async (ws, req) => {
    const throwClose = getSocketCloseAndThrow(ws);
    const requestUrl = url.parse(
      req.url || throwClose("Connection is missing url"),
      true
    );
    //If server connection
    if (requestUrl.pathname && /lobby-host(\/?)$/.test(requestUrl.pathname)) {
      const roomId = await incrementRedisValue("rooms");
      const roomAddress = `room/${roomId}`;
      await setRedisValue(roomAddress, "yes");
      ws.send(JSON.stringify({ roomId }));
      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        message.to &&
          pubsubClient.publish(`${roomAddress}/client/${message.to}`, message);
      });
      const unsub = setupPubSubSubscriber(roomAddress, ws.send);
      return ws.on("close", () => {
        unsub();
        redisClient.del(`room/${roomId}`);
      });
    }
    //Else, if client
    const roomId = requestUrl.query.roomId;
    if (typeof roomId === "string") {
      const roomAddress = `room/${roomId}`;
      if (!redisClient.exists(roomAddress)) {
        throwClose("Connecting to room that does not exist", 1013);
      }
      ws.on("message", (data) =>
        pubsubClient.publish(roomAddress, data.toString())
      );
      const clientId = await incrementRedisValue(`${roomAddress}/client`);
      const unsub = setupPubSubSubscriber(
        `${roomAddress}/client/${clientId}`,
        ws.send
      );
      return ws.on("close", unsub);
    }
    throwClose(
      "Not a valid connection, either join as hosting server or connecting client"
    );
  })
);

server.listen(process.env.PORT || 8080);
