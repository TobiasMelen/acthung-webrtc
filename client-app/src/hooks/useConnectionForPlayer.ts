import { useEffect, useState, useMemo } from "react";
import {
  MessageChannelToLobby,
  createMessageChannelToLobby,
} from "../messaging/dataChannelMessaging";
import { DEFAULT_RTC_PEER_CONFIG, SIGNALING_URL } from "../constants";
import useJsonWebsocket from "./useJsonWebsocket";
import { uuidV4 } from "../utility";

type Props = {
  lobbyName: string;
};

export default function useConnectionForPlayer({ lobbyName }: Props) {
  const [lobbyMessageChannel, setLobbyMessageChannel] =
    useState<MessageChannelToLobby>();
  //Create id on client session to support reconnecting. This will be a secret between server/client.
  const playerId = useMemo(() => {
    const key = `playerId/${lobbyName}`;
    let sessionId = sessionStorage[key];
    if (sessionId == null) {
      sessionId = uuidV4()
      sessionStorage[key] = sessionId;
    }
    return sessionId;
  }, [lobbyName]);

  //only keep ws connection before webrtc is established
  const socket = useJsonWebsocket(
    lobbyMessageChannel == null ? `${SIGNALING_URL}/${playerId}` : undefined
  );

  useEffect(() => {
    if (lobbyMessageChannel != null || socket.status != "connected") {
      return;
    }
    const peerConnection = new RTCPeerConnection(DEFAULT_RTC_PEER_CONFIG);

    const channel = peerConnection.createDataChannel("Client data channel", {
      maxRetransmits: 1,
      ordered: false,
    });
    channel.onopen = () => {
      const handles = createMessageChannelToLobby(peerConnection, channel);
      setLobbyMessageChannel(handles);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate != null) {
        socket.send({
          to: lobbyName,
          from: playerId,
          data: event.candidate.toJSON(),
        });
      }
    };
    let peerDisconnectTimeout: number | undefined;
    peerConnection.oniceconnectionstatechange = () => {
      //clear disconnect timeout if set.
      clearTimeout(peerDisconnectTimeout);
      const disconnect = () =>
        setLobbyMessageChannel((channel) => {
          channel?.destroy();
          return undefined;
        });
      switch (peerConnection.iceConnectionState) {
        case "disconnected":
        case "failed": {
          disconnect();
          break;
        }
      }
    };
    socket.addListener(async ({ data }) => {
      if (data.type === "answer") {
        await peerConnection.setRemoteDescription(data);
      } else if ("candidate" in data) {
        await peerConnection.addIceCandidate(data);
      }
    });
    peerConnection.createOffer().then(async (offer) => {
      await peerConnection.setLocalDescription(offer);
      socket.send({ data: offer, to: lobbyName, from: playerId });
    });
  }, [lobbyMessageChannel, lobbyName, socket]);

  return lobbyMessageChannel;
}
