import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import {
  createRTCPeerConnection,
  createSignalClient,
  ClientMessage,
  LobbyMessage,
  ConnectionListener,
  ConnectionDispatch,
  createChannelHandles
} from "./commonConnections";

export type LobbyConnection = {
  send: ConnectionDispatch<ClientMessage>;
  on: ConnectionListener<LobbyMessage>;
};

type Props = {
  lobbyName: string;
  children(connection?: LobbyConnection): JSX.Element;
};

export default function ClientConnection({ lobbyName, children }: Props) {
  const [lobbyConnection, setLobbyConnection] = useState<LobbyConnection>();
  useEffect(() => {
    const signalClient = createSignalClient({
      query: {
        joinLobby: lobbyName
      }
    });
    signalClient.on("connect", async (s: any) => {
      if (lobbyConnection != null) {
        return;
      }
      const peerConnection = createRTCPeerConnection();

      const channel = peerConnection.createDataChannel("Client data channel");
      channel.onopen = () => setLobbyConnection(createChannelHandles(channel));
      channel.onclose = () => setLobbyConnection(undefined);

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

  return children(lobbyConnection);
}
