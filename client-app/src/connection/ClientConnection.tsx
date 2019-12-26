import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  createRTCPeerConnection,
  createSignalClient
} from "./commonConnections";

type Props = {
  lobbyName: string;
  children(channel?: RTCDataChannel): JSX.Element;
};

export default function ClientConnection({ lobbyName, children }: Props) {
  const [dataChannel, setDataChannel] = useState<RTCDataChannel>();
  useEffect(() => {
    const signalClient = createSignalClient({
      query: {
        joinLobby: lobbyName
      }
    });
    signalClient.on("connect", async (s: any) => {
      if (dataChannel != null) {
        return;
      }

      const peerConnection = createRTCPeerConnection();

      const channel = peerConnection.createDataChannel("Client data channel");
      channel.onopen = () => setDataChannel(channel);
      channel.onclose = () => setDataChannel(undefined);

      peerConnection.onicecandidate = event => {
        if (event.candidate != null) {
          signalClient.send({ to: lobbyName, data: event.candidate.toJSON() });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      signalClient.send({ data: offer, to: lobbyName });
      signalClient.on("message", async ({ data }: any) => {
        if (data.type === "answer") {
          await peerConnection.setRemoteDescription(data);
        } else if ("candidate" in data) {
          peerConnection.addIceCandidate(data);
        }
      });
    });
  }, []);

  return children(dataChannel);
}
