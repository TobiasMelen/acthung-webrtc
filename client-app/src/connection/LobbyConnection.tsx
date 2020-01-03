import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createRTCPeerConnection
} from "./commonConnections";
import useSignalClient from "./useSignalClient";
import { createMessageChannelToPlayer, MessageChannelToPlayer } from "../messaging/dataChannelMessaging";

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

  const onClientDataChannel = useCallback(
    (id: string) => ({ channel }: RTCDataChannelEvent) => {
      channel.onclose = () =>
        setClientConnections(connections =>
          Object.keys(connections).reduce((acc, key) => {
            key !== id && acc[key] == connections.key;
            return acc;
          }, {} as PlayerConnections)
        );
      setClientConnections(connections => ({
        ...connections,
        [id]: createMessageChannelToPlayer(channel)
      }));
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
        clientConnection.ondatachannel = onClientDataChannel(offerFrom);
        clientConnection.onicecandidate = event =>
          event.candidate != null &&
          signalClient.send({
            to: offerFrom,
            data: event.candidate.toJSON()
          });
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
