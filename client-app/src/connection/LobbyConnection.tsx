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
  const [clientConnections, setClientConnections] = useState<{
    [id: string]: [RTCPeerConnection, MessageChannelToPlayer];
  }>({});

  const [signalClient] = useSignalClient(
    useMemo(
      () => ({
        query: {
          hostLobby: lobbyName
        }
      }),
      [lobbyName]
    )
  );

  const removeStaleConnection = useCallback(
    (staleConnection: RTCPeerConnection) => {
      setClientConnections(connections =>
        Object.keys(connections).reduce((acc, key) => {
          if (connections[key]?.[0] !== staleConnection) {
            acc[key] = connections[key];
          } else {
            //stale connection, try closing everything if it still is around.
            console.log("discarding connection in state", staleConnection.iceConnectionState)
            try {
              connections[key][1].destroy();
            } catch (err) {
              console.error("Error cleaning up stale connection", err);
            }
          }
          return acc;
        }, {} as typeof clientConnections)
      );
    },
    [setClientConnections]
  );

  const onClientDataChannel = useCallback(
    (connection: RTCPeerConnection, id: string) => ({
      channel
    }: RTCDataChannelEvent) => {
      channel.onclose = () => removeStaleConnection(connection);
      setClientConnections(connections => {
        return {
          ...connections,
          [id]: [connection, createMessageChannelToPlayer(connection, channel)]
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
        clientConnection.ondatachannel = onClientDataChannel(
          clientConnection,
          offerFrom
        );
        clientConnection.onicecandidate = event =>
          event.candidate != null &&
          signalClient.send({
            to: offerFrom,
            data: event.candidate.toJSON()
          });
        clientConnection.oniceconnectionstatechange = () => {
          clientConnection.iceConnectionState === "failed" ||
            (clientConnection.iceConnectionState === "disconnected" &&
              removeStaleConnection(clientConnection));
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

  const playerConnections = useMemo(
    () =>
      Object.entries(clientConnections).reduce((acc, [key, value]) => {
        acc[key] = value[1];
        return acc;
      }, {} as PlayerConnections),
    [clientConnections]
  );

  return children(playerConnections);
}
