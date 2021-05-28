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

type ConnectionStatus = "CONNECTING" | "RECONNECTING" | "NO_LOBBY" | "ERROR";

export default function useConnectionForPlayer({ lobbyName }: Props) {
  const [lobbyMessageChannel, setLobbyMessageChannel] =
    useState<MessageChannelToLobby>();
  //Create id on client session to support reconnecting. This will be a secret between server/client.
  const [playerId, isReconnect] = useMemo(() => {
    const key = `playerId/${lobbyName}`;
    const prevSessionId = sessionStorage[key];
    if (prevSessionId) {
      return [prevSessionId, true];
    }
    const sessionId = uuidV4();
    sessionStorage[key] = sessionId;
    return [sessionId, false];
  }, [lobbyName]);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isReconnect ? "RECONNECTING" : "CONNECTING"
  );

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
    peerConnection.oniceconnectionstatechange = () => {
      const disconnect = () => {
        setLobbyMessageChannel((channel) => {
          channel?.destroy();
          return undefined;
        });
        setConnectionStatus("ERROR");
      };
      switch (peerConnection.iceConnectionState) {
        case "disconnected":
        case "failed": {
          disconnect();
          break;
        }
      }
    };
    let timeout: number;
    socket.addListener(async ({ data }) => {
      clearTimeout(timeout);
      if (data.type === "answer") {
        await peerConnection.setRemoteDescription(data);
      } else if ("candidate" in data) {
        await peerConnection.addIceCandidate(data);
      }
    });
    peerConnection.createOffer().then(async (offer) => {
      timeout = window.setTimeout(() => {
        setConnectionStatus((connectionStatus) =>
          connectionStatus !== "ERROR" ? "NO_LOBBY" : "ERROR"
        );
      }, 1000);
      await peerConnection.setLocalDescription(offer);
      socket.send({ data: offer, to: lobbyName, from: playerId });
    });
  }, [lobbyMessageChannel, lobbyName, socket]);

  return [lobbyMessageChannel, connectionStatus] as const;
}
