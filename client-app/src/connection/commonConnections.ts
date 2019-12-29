import io from "socket.io-client";
import { SIGNALING_URL } from "../constants";

export type ConnectionDispatch<MessageType> = (message: MessageType) => void;
export type ConnectionListener<MessageType extends { type: string }> = <
  TKey extends MessageType["type"]
>(
  messageType: TKey,
  handler: (data: MessageData<MessageType, TKey>) => void
) => void;


export type Connection<TSend extends { type: string }, TRecieve extends { type: string }> = {
  send: ConnectionDispatch<TSend>;
  on: ConnectionListener<TRecieve>;
};

export type MessageData<MessageType, TKey> = MessageType extends {
  type: TKey;
  data: infer Data;
}
  ? Data
  : never;

export type PlayerState = {
  name: string;
  color: string;
  score: number;
  ready: boolean;
  state: "joining" | "playing" | "dead";
  latency: number;
};

export type Ping = { type: "ping"; data: { timeStamp: number } };

export type LobbyMessage =
  | { type: "playerState"; data: PlayerState }
  | { type: "err"; data: { reason: "lobbyFull"; queuespot: number } }
  | Ping;

export type ClientMessage =
  | { type: "setColor"; data: string }
  | { type: "setReady"; data: boolean }
  | { type: "setName"; data: string }
  | { type: "turn"; data: number }
  | Ping;

export function createSignalClient(opts: SocketIOClient.ConnectOpts) {
  return io(
    SIGNALING_URL, 
    {
      transports: ["websocket"],
      ...opts
    }
  );
}

export function createRTCPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
  });
}

export function createChannelHandles<
  TSend,
  TRecieve extends { type: string; data: any }
>(
  channel: RTCDataChannel,
  bounceMessages: string[] = []
): {
  send: ConnectionDispatch<TSend>;
  on: ConnectionListener<TRecieve>;
} {
  const handlers: Map<TRecieve["type"], TRecieve["data"]> = new Map();
  channel.addEventListener("message", event => {
    const json = JSON.parse(event.data) as TRecieve;
    const type = json.type as string | undefined;
    if (type && bounceMessages.indexOf(type) !== -1) {
      channel.send(event.data);
    }
    const handler = type && handlers.get(type);
    if (handler) {
      handler(json.data);
    }
  });
  return {
    send(data) {
      channel.send(JSON.stringify(data));
    },
    on(message, handler) {
      handlers.set(message, handler);
    }
  };
}
