import { useEffect, useState, useMemo } from "react";
import {
  createRTCPeerConnection,
  createSignalClient
} from "./commonConnections";
import uuid from "uuid/v4";
import {
  MessageChannelToLobby,
  createMessageChannelToLobby
} from "../messaging/dataChannelMessaging";

type Props = {
  lobbyName: string;
  children(connection?: MessageChannelToLobby): JSX.Element;
};

export default function ClientConnection({ lobbyName, children }: Props) {
  const [lobbyMessageChannel, setLobbyMessageChannel] = useState<
    MessageChannelToLobby
  >();
  //Create id on client session to support reconnecting. This will be a secret between server/client.
  const clientId = useMemo(() => {
    const key = `clientId/${lobbyName}`;
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

    const signalClient = createSignalClient({
      query: {
        joinLobby: lobbyName,
        from: clientId
      }
    });

    signalClient.on("connect", async () => {
      const peerConnection = createRTCPeerConnection();

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
            from: clientId,
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
      signalClient.send({ data: offer, to: lobbyName, from: clientId });
      signalClient.on("message", async ({ data }: any) => {
        if (data.type === "answer") {
          await peerConnection.setRemoteDescription(data);
        } else if ("candidate" in data) {
          peerConnection.addIceCandidate(data);
        }
      });
    });
  }, [lobbyMessageChannel, lobbyName]);

  return children(lobbyMessageChannel);
}
