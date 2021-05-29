import {
  jsonConverter,
  stringConverter,
  booleanConverter,
  numberConverter,
} from "./valueConverters";
import setupMessageChannel, { Converter } from "./setupMessageChannel";

const messagesToPlayer = {
  playerState: jsonConverter as Converter<Partial<PlayerState>>,
  gameState: jsonConverter as Converter<Partial<GameState>>,
  ping: numberConverter,
  err: jsonConverter,
};

const messagesToLobby = {
  setColor: stringConverter,
  setReady: booleanConverter,
  setName: stringConverter,
  allowSinglePlayer: booleanConverter,
  turn: numberConverter,
  ping: numberConverter,
};

export type MessageTypesToPlayer = keyof typeof messagesToPlayer;
export type MessageTypesToLobby = keyof typeof messagesToLobby;

export type MessageChannelToPlayer = ReturnType<
  typeof createMessageChannelToPlayer
>;

export function createMessageChannelToPlayer(
  connection: RTCPeerConnection,
  dataChannel: RTCDataChannel
) {
  return setupMessageDataChannel(connection, dataChannel)(
    messagesToPlayer,
    messagesToLobby,
    "ping"
  );
}

export type MessageChannelToLobby = ReturnType<
  typeof createMessageChannelToLobby
>;

export function createMessageChannelToLobby(
  connection: RTCPeerConnection,
  dataChannel: RTCDataChannel
) {
  return setupMessageDataChannel(connection, dataChannel)(
    messagesToLobby,
    messagesToPlayer
  );
}

function setupMessageDataChannel(
  connection: RTCPeerConnection,
  dataChannel: RTCDataChannel
) {
  return setupMessageChannel({
    send: (msg) => dataChannel.readyState === "open" && dataChannel.send(msg),
    bindReceive(receive) {
      dataChannel.addEventListener("message", (ev) => receive(ev.data));
      return () => {
        dataChannel.close();
        connection.close();
      };
    },
  });
}
