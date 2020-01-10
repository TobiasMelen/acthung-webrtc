import { useEffect, useState, useMemo } from "react";
import uuid from "uuid/v4";
import {
  MessageChannelToLobby,
  createMessageChannelToLobby
} from "../messaging/dataChannelMessaging";
import { SIGNAL_CLIENT_DEFAULT_PARAMS, DEFAULT_RTC_PEER_CONFIG } from "../constants";

type Props = {
  lobbyName: string;
};

export default function useConnectionForPlayer({ lobbyName }: Props) {
  const [lobbyMessageChannel, setLobbyMessageChannel] = useState<
    MessageChannelToLobby
  >();
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

    const signalClient = io(
      ...SIGNAL_CLIENT_DEFAULT_PARAMS({
        query: {
          joinLobby: lobbyName,
          from: playerId
        }
      })
    );

    signalClient.on("connect", async () => {
      const peerConnection = new RTCPeerConnection(DEFAULT_RTC_PEER_CONFIG);

      const channel = peerConnection.createDataChannel("Client data channel", {
        maxRetransmits: 1,
        ordered: false
      });
      channel.onopen = () => {
        const handles = createMessageChannelToLobby(peerConnection, channel);
        setLobbyMessageChannel(handles);
      };

      peerConnection.onicecandidate = event => {
        if (event.candidate != null) {
          signalClient.send({
            to: lobbyName,
            from: playerId,
            data: event.candidate.toJSON()
          });
        }
      };
      let peerDisconnectTimeout: number | undefined;
      peerConnection.oniceconnectionstatechange = () => {
        //clear disconnect timeout if set.
        clearTimeout(peerDisconnectTimeout);
        const disconnect = () =>
          setLobbyMessageChannel(channel => {
            channel?.destroy();
            return undefined;
          });
        switch (peerConnection.iceConnectionState) {
          case "completed": {
            //Connection has been made. No need to keep the connection the signal server open.
            //(Hopefully webrtc won't try to send more candidates)
            //signalClient.disconnect();
            break;
          }
          case "disconnected": {
            //Give this weirdly documented state one second to recover before trying a reconnect from scratch;
            peerDisconnectTimeout = window.setTimeout(disconnect, 1000);
            break;
          }
          case "failed": {
            disconnect();
            break;
          }
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      signalClient.send({ data: offer, to: lobbyName, from: playerId });
      signalClient.on("message", async ({ data }: any) => {
        if (data.type === "answer") {
          await peerConnection.setRemoteDescription(data);
        } else if ("candidate" in data) {
          peerConnection.addIceCandidate(data);
        }
      });
    });
  }, [lobbyMessageChannel, lobbyName]);

  return lobbyMessageChannel;
}
