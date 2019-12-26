import io from "socket.io-client";

export type ConnectionDispatch<MessageType> = (message: MessageType) => void;
export type ConnectionListener<MessageType extends { type: string }> = <
  TKey extends MessageType["type"]
>(
  messageType: TKey,
  handler: (data: MessageData<MessageType, TKey>) => void
) => void;

type MessageData<MessageType, TKey> = MessageType extends {
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
};

export type LobbyMessage =
  | { type: "playerState"; data: PlayerState }
  | { type: "err"; data: { reason: "lobbyFull"; queuespot: number } };

export type ClientMessage =
  | { type: "setColor"; data: string }
  | { type: "setReady"; data: boolean }
  | { type: "setName"; data: string }
  | { type: "turn"; data: number };

export function createSignalClient(opts: SocketIOClient.ConnectOpts) {
  return io(process.env.SIGNAL_URL, {
    transports: ["websocket"],
    ...opts
  });
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
  channel: RTCDataChannel
): {
  send: ConnectionDispatch<TSend>;
  on: ConnectionListener<TRecieve>;
} {
  return {
    send(data) {
      channel.send(JSON.stringify(data));
    },
    on(message, handler) {
      channel.addEventListener("message", event => {
        const json = JSON.parse(event.data) as TRecieve;
        if ("type" in json && json.type === message && "data" in json) {
          handler(json.data);
        }
      });
    }
  };
}
