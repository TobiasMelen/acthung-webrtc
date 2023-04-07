import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_RTC_PEER_CONFIG, SIGNALING_URL } from "../constants";
import {
  createMessageChannelToPlayer,
  MessageChannelToPlayer,
} from "../messaging/dataChannelMessaging";
import useJsonWebsocket from "./useJsonWebsocket";

export type PlayerConnections = {
  [id: string]: MessageChannelToPlayer;
};

export default function useLobbyConnection(lobbyName: string) {
  const [clientConnections, setClientConnections] = useState<{
    [id: string]: [RTCPeerConnection, MessageChannelToPlayer];
  }>({});

  const socket = useJsonWebsocket(`${SIGNALING_URL}/${lobbyName}`);

  const removeStaleConnection = useCallback(
    (staleConnection: RTCPeerConnection) => {
      setClientConnections((connections) =>
        Object.keys(connections).reduce((acc, key) => {
          if (connections[key]?.[0] !== staleConnection) {
            acc[key] = connections[key];
          } else {
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

  useEffect(() => {
    if (socket.status !== "connected") {
      return;
    }

    const unbindSocketListener = socket.addListener(
      async ({ from: offerFrom, data }) => {
        if (data.type !== "offer" || offerFrom == null) {
          return;
        }
        const clientConnection = new RTCPeerConnection(DEFAULT_RTC_PEER_CONFIG);

        clientConnection.onicecandidate = (event) =>
          event.candidate != null &&
          socket.send({
            to: offerFrom,
            data: event.candidate.toJSON(),
          });
        const unbindPeerSignaling = socket.addListener(
          ({ from: candidateFrom, data }) =>
            candidateFrom === offerFrom &&
            "candidate" in data &&
            clientConnection.addIceCandidate(data)
        );
        const closeConnection = () => {
          unbindPeerSignaling?.();
          removeStaleConnection(clientConnection);
        };
        clientConnection.ondatachannel = ({ channel }: RTCDataChannelEvent) => {
          channel.onclose = closeConnection;
          setClientConnections((connections) => ({
            ...connections,
            [offerFrom]: [
              clientConnection,
              createMessageChannelToPlayer(clientConnection, channel),
            ],
          }));
        };
        clientConnection.onconnectionstatechange = () => {
          const state = clientConnection.connectionState;
          if (state == "disconnected") {
            closeConnection();
          }
        };
        await clientConnection.setRemoteDescription(
          new RTCSessionDescription(data)
        );
        const localDescription = await clientConnection.createAnswer();
        await clientConnection.setLocalDescription(localDescription);
        socket.send({ data: localDescription, to: offerFrom });
      }
    );
    return unbindSocketListener;
  }, [socket]);

  const playerConnections = useMemo(
    () =>
      Object.entries(clientConnections).reduce((acc, [key, value]) => {
        acc[key] = value[1];
        return acc;
      }, {} as PlayerConnections),
    [clientConnections]
  );

  return [socket.status, playerConnections] as const;
}
