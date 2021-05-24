import { useCallback, useEffect, useMemo, useState } from "react";
import useSignalClient from "./useSignalClient";
import {
  createMessageChannelToPlayer,
  MessageChannelToPlayer,
} from "../messaging/dataChannelMessaging";
import { DEFAULT_RTC_PEER_CONFIG, SIGNALING_URL } from "../constants";

export type PlayerConnections = {
  [id: string]: MessageChannelToPlayer;
};

type OfferMessage = { from?: string; data: RTCSessionDescriptionInit };

type CandidateMessage = { from?: string; data: RTCIceCandidateInit | {} };

export default function useLobbyConnection(lobbyName: string) {
  const [clientConnections, setClientConnections] = useState<{
    [id: string]: [RTCPeerConnection, MessageChannelToPlayer];
  }>({});

  // const [signalClient] = useSignalClient(
  //   useMemo(
  //     () => ({
  //       query: {
  //         hostLobby: lobbyName,
  //       },
  //     }),
  //     [lobbyName]
  //   )
  // );

  const socket = useMemo(
    () => new WebSocket(`${SIGNALING_URL}/${lobbyName}`),
    [SIGNALING_URL, lobbyName]
  );

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
    socket.addEventListener("message", async ({ data: message }) => {
      const { from: offerFrom, data } = JSON.parse(message) as OfferMessage;
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
        socket.send(
          JSON.stringify({
            to: offerFrom,
            data: event.candidate.toJSON(),
          })
        );
      clientConnection.oniceconnectionstatechange = () => {
        clientConnection.iceConnectionState === "failed" ||
          (clientConnection.iceConnectionState === "disconnected" &&
            removeStaleConnection(clientConnection));
      };
      socket.addEventListener("message", ({ data: message }) => {
        const { from: candidateFrom, data } = JSON.parse(
          message
        ) as CandidateMessage;
        return (
          candidateFrom === offerFrom &&
          "candidate" in data &&
          clientConnection.addIceCandidate(data)
        );
      });
      await clientConnection.setRemoteDescription(
        new RTCSessionDescription(data)
      );
      const localDescription = await clientConnection.createAnswer();
      await clientConnection.setLocalDescription(localDescription);
      socket.send(JSON.stringify({ data: localDescription, to: offerFrom }));
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
