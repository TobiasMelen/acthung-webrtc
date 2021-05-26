import { useCallback, useEffect, useMemo, useState } from "react";
import useSignalClient from "./useSignalClient";
import {
  createMessageChannelToPlayer,
  MessageChannelToPlayer,
} from "../messaging/dataChannelMessaging";
import { DEFAULT_RTC_PEER_CONFIG, SIGNALING_URL } from "../constants";
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

  const onClientDataChannel = useCallback(
    (connection: RTCPeerConnection, id: string) =>
      ({ channel }: RTCDataChannelEvent) => {
        channel.onclose = () => removeStaleConnection(connection);
        setClientConnections((connections) => {
          return {
            ...connections,
            [id]: [
              connection,
              createMessageChannelToPlayer(connection, channel),
            ],
          };
        });
      },
    [setClientConnections]
  );

  useEffect(() => {
    if (socket.status !== "connected") {
      return;
    }
    socket.addListener(async ({ from: offerFrom, data }) => {
      if (data.type !== "offer" || offerFrom == null) {
        return;
      }
      const clientConnection = new RTCPeerConnection(DEFAULT_RTC_PEER_CONFIG);
      clientConnection.ondatachannel = onClientDataChannel(
        clientConnection,
        offerFrom
      );
      clientConnection.onicecandidate = (event) =>
        event.candidate != null &&
        socket.send({
          to: offerFrom,
          data: event.candidate.toJSON(),
        });
      clientConnection.oniceconnectionstatechange = () => {
        clientConnection.iceConnectionState === "failed" ||
          (clientConnection.iceConnectionState === "disconnected" &&
            removeStaleConnection(clientConnection));
      };
      socket.addListener(
        ({ from: candidateFrom, data }) =>
          candidateFrom === offerFrom &&
          "candidate" in data &&
          clientConnection.addIceCandidate(data)
      );
      await clientConnection.setRemoteDescription(
        new RTCSessionDescription(data)
      );
      const localDescription = await clientConnection.createAnswer();
      await clientConnection.setLocalDescription(localDescription);
      socket.send({ data: localDescription, to: offerFrom });
    });
  }, [socket, onClientDataChannel]);

  const playerConnections = useMemo(
    () =>
      Object.entries(clientConnections).reduce((acc, [key, value]) => {
        acc[key] = value[1];
        return acc;
      }, {} as PlayerConnections),
    [clientConnections]
  );

  return playerConnections;
}
