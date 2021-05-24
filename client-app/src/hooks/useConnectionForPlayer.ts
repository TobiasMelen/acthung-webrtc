import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";
import {
  MessageChannelToLobby,
  createMessageChannelToLobby,
} from "../messaging/dataChannelMessaging";
import {
  DEFAULT_RTC_PEER_CONFIG,
  SIGNALING_URL,
} from "../constants";

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
      sessionId = uuid();
      sessionStorage[key] = sessionId;
    }
    return sessionId;
  }, [lobbyName]);

  useEffect(() => {
    if (lobbyMessageChannel != null) {
      return;
    }
    const socket = new WebSocket(`${SIGNALING_URL}/${playerId}`);

    socket.addEventListener("open", async () => {
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
          socket.send(
            JSON.stringify({
              to: lobbyName,
              from: playerId,
              data: event.candidate.toJSON(),
            })
          );
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
      socket.addEventListener("message", async ({ data: message }) => {
        const { data } = JSON.parse(message);
        if (data.type === "answer") {
          await peerConnection.setRemoteDescription(data);
        } else if ("candidate" in data) {
          await peerConnection.addIceCandidate(data);
        }
      });
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(await offer);
      
      socket.send(
        JSON.stringify({ data: offer, to: lobbyName, from: playerId })
      );
    });
  }, [lobbyMessageChannel, lobbyName]);

  return lobbyMessageChannel;
}
