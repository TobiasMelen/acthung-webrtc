import {
  jsonConverter,
  passValueConverter,
  booleanConverter,
  numberConverter
} from "./valueConverters";
import setupMessageChannel, { Converter } from "./setupMessageChannel";

const messagesFromLobby = {
  playerState: jsonConverter as Converter<Partial<PlayerState>>,
  gameState: jsonConverter as Converter<Partial<GameState>>,
  ping: numberConverter,
  err: jsonConverter
};

const messagesFromPlayer = {
  setColor: passValueConverter,
  setReady: booleanConverter,
  setName: passValueConverter,
  turn: numberConverter,
  ping: numberConverter
};

export type MessageChannelToPlayer = ReturnType<
  typeof createMessageChannelToPlayer
>;

export function createMessageChannelToPlayer(
  connection: RTCPeerConnection,
  dataChannel: RTCDataChannel
) {
  return setupMessageDataChannel(connection, dataChannel)(
    messagesFromLobby,
    messagesFromPlayer,
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
    messagesFromPlayer,
    messagesFromLobby
  );
}

function setupMessageDataChannel(
  connection: RTCPeerConnection,
  dataChannel: RTCDataChannel
) {
  return setupMessageChannel({
    send: msg => dataChannel.readyState === "open" && dataChannel.send(msg),
    triggerReceive(trigger) {
      dataChannel.addEventListener("message", ev => trigger(ev.data));
    },
    destroy() {
      dataChannel.close();
      connection.close();
    }
  });
}
