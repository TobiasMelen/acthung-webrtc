import { useCallback, useEffect, useMemo, useState } from "react";
import { createRTCPeerConnection } from "./commonConnections";
import useSignalClient from "./useSignalClient";
import {
  createMessageChannelToPlayer,
  MessageChannelToPlayer
} from "../messaging/dataChannelMessaging";

export type PlayerConnections = {
  [id: string]: MessageChannelToPlayer;
};

type Props = {
  lobbyName: string;
  children: (clientConnections: PlayerConnections) => JSX.Element;
};

type OfferMessage = { from?: string; data: RTCSessionDescriptionInit };

type CandidateMessage = { from?: string; data: RTCIceCandidateInit | {} };

export default function LobbyConnection({ lobbyName, children }: Props) {
  const [clientConnections, setClientConnections] = useState<PlayerConnections>(
    {}
  );

  const [signalClient, signalStatus] = useSignalClient(
    useMemo(
      () => ({
        query: {
          hostLobby: lobbyName
        }
      }),
      [lobbyName]
    )
  );

  const removeConnection = useCallback(
    (id: string) => {
      setClientConnections(connections =>
        Object.keys(connections).reduce((acc, key) => {
          key !== id && acc[key] == connections.key;
          return acc;
        }, {} as PlayerConnections)
      );
    },
    [setClientConnections]
  );

  const onClientDataChannel = useCallback(
    (connection: RTCPeerConnection, id: string) => ({ channel }: RTCDataChannelEvent) => {
      channel.onclose = () => removeConnection(id);
      setClientConnections(connections => {
        if(connections[id] != null){
          connections[id].off
        }
        return {
          ...connections,
          [id]: createMessageChannelToPlayer(connection, channel)
        };
      });
    },
    [setClientConnections]
  );

  useEffect(() => {
    signalClient.on(
      "message",
      async ({ from: offerFrom, data }: OfferMessage) => {
        if (data.type !== "offer" || offerFrom == null) {
          return;
        }
        const clientConnection = createRTCPeerConnection();
        clientConnection.ondatachannel = onClientDataChannel(clientConnection, offerFrom);
        clientConnection.onicecandidate = event =>
          event.candidate != null &&
          signalClient.send({
            to: offerFrom,
            data: event.candidate.toJSON()
          });
        clientConnection.oniceconnectionstatechange = () => {
          clientConnection.iceConnectionState === "failed" ||
            (clientConnection.iceConnectionState === "disconnected" &&
              removeConnection(offerFrom));
        };
        signalClient.on(
          "message",
          ({ from: candidateFrom, data }: CandidateMessage) =>
            candidateFrom === offerFrom &&
            "candidate" in data &&
            clientConnection.addIceCandidate(data)
        );
        await clientConnection.setRemoteDescription(
          new RTCSessionDescription(data)
        );
        const localDescription = await clientConnection.createAnswer();
        await clientConnection.setLocalDescription(localDescription);
        signalClient.send({ data: localDescription, to: offerFrom });
      }
    );
  }, [signalClient, onClientDataChannel]);
  return children(clientConnections);
}
