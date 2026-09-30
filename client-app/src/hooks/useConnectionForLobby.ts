import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_RTC_PEER_CONFIG } from "../constants";
import {
  createMessageChannelToPlayer,
  MessageChannelToPlayer,
} from "../messaging/dataChannelMessaging";
import useSignaling from "./useSignaling";
import debugLog from "../debugLog";
import { toLegacyCompatibleDescription } from "../utility";

export type PlayerConnections = {
  [id: string]: MessageChannelToPlayer;
};

export default function useLobbyConnection(lobbyName: string) {
  const [clientConnections, setClientConnections] = useState<{
    [id: string]: [RTCPeerConnection, MessageChannelToPlayer];
  }>({});

  const socket = useSignaling(lobbyName);

  const closeConnection = useCallback((peerId: string) => {
    setClientConnections((connections) => {
      const existing = connections[peerId];
      if (existing) {
        try {
          existing[0].close();
          existing[1].destroy();
        } catch (err) {
          console.error("Error cleaning up connection for", peerId, err);
        }
      }
      const { [peerId]: _, ...rest } = connections;
      return rest;
    });
  }, []);

  useEffect(() => {
    if (socket.status !== "connected") {
      return;
    }
    const unbindSocketListener = socket.addListener(
      async ({ from: offerFrom, data }) => {
        if (data.type !== "offer" || offerFrom == null) {
          return;
        }
        const peerLabel = `peer ${offerFrom.slice(0, 6)}:`;
        debugLog(peerLabel, "offer received");

        // Close any existing connection from the same peer before creating new one
        closeConnection(offerFrom);

        const clientConnection = new RTCPeerConnection(DEFAULT_RTC_PEER_CONFIG);
        // Track if answer has been sent (for non-trickle ICE)
        let answerSent = false;

        clientConnection.onicecandidate = (event) => {
          if (socket.supportsTrickleIce) {
            // Send ICE candidates incrementally
            if (event.candidate != null) {
              socket.send({
                to: offerFrom,
                data: event.candidate.toJSON(),
              });
            }
          } else {
            // null candidate means ICE gathering is complete
            if (event.candidate === null && !answerSent) {
              answerSent = true;
              debugLog(peerLabel, "answer sent");
              socket.send({
                data: clientConnection.localDescription?.toJSON(),
                to: offerFrom,
              });
            }
          }
        };

        // Set up signaling listener for trickle ICE
        const unbindPeerSignaling = socket.supportsTrickleIce
          ? socket.addListener(
              ({ from: candidateFrom, data }) =>
                candidateFrom === offerFrom &&
                "candidate" in data &&
                clientConnection.addIceCandidate(data),
            )
          : undefined;

        const cleanupConnection = () => {
          unbindPeerSignaling?.();
          closeConnection(offerFrom);
        };

        clientConnection.ondatachannel = ({ channel }: RTCDataChannelEvent) => {
          debugLog(peerLabel, "data channel open");
          channel.onclose = cleanupConnection;
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
          if (state == "disconnected" || state == "failed") {
            cleanupConnection();
          }
        };
        //connectionState only exists from Chromium 72, older engines need ICE state.
        const hasConnectionState = clientConnection.connectionState !== undefined;
        clientConnection.oniceconnectionstatechange = () => {
          const state = clientConnection.iceConnectionState;
          debugLog(peerLabel, "ice", state);
          if (!hasConnectionState && (state == "disconnected" || state == "failed")) {
            cleanupConnection();
          }
        };

        let localDescription: RTCSessionDescriptionInit;
        try {
          await clientConnection.setRemoteDescription(
            new RTCSessionDescription(toLegacyCompatibleDescription(data)),
          );
          localDescription = await clientConnection.createAnswer();
          await clientConnection.setLocalDescription(localDescription);
        } catch (error) {
          debugLog(peerLabel, "answer failed", error);
          return;
        }
        debugLog(peerLabel, "answer created, gathering candidates");

        if (socket.supportsTrickleIce) {
          // Send answer immediately, ICE candidates will follow
          socket.send({ data: localDescription, to: offerFrom });
        }
        // For non-trickle ICE, the answer is sent from onicecandidate when candidate is null
      },
    );
    return () => {
      unbindSocketListener();
    };
  }, [socket, closeConnection]);

  const playerConnections = useMemo(
    () =>
      Object.entries(clientConnections).reduce((acc, [key, value]) => {
        acc[key] = value[1];
        return acc;
      }, {} as PlayerConnections),
    [clientConnections],
  );

  return [socket.status, playerConnections] as const;
}
