import {
  jsonConverter,
  passValueConverter,
  booleanConverter,
  numberConverter
} from "./valueConverters";
import setupMessageChannel, { Converter } from "./setupMessageChannel";
import { PlayerState, GameState } from "../connection/commonConnections";

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

export type MessageChannelToPlayer = ReturnType<typeof createMessageChannelToPlayer>;

export function createMessageChannelToPlayer(dataChannel: RTCDataChannel) {
  return setupMessageDataChannel(dataChannel)(
    messagesFromLobby,
    messagesFromPlayer,
    "ping"
  );
}

export type MessageChannelToLobby = ReturnType<typeof createMessageChannelToLobby>;

export function createMessageChannelToLobby(dataChannel: RTCDataChannel) {
  return setupMessageDataChannel(dataChannel)(
    messagesFromPlayer,
    messagesFromLobby
  );
}

function setupMessageDataChannel(dataChannel: RTCDataChannel) {
  return setupMessageChannel({
    send: dataChannel.send,
    triggerReceive(trigger) {
      dataChannel.addEventListener("message", ev => trigger(ev.data));
    }
  });
}
