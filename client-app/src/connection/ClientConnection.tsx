import React, { useEffect, useState, useMemo } from "react";
import {
  createRTCPeerConnection,
  createSignalClient,
  ClientMessage,
  LobbyMessage,
  ConnectionListener,
  ConnectionDispatch,
  createChannelHandles
} from "./commonConnections";
import uuid from "uuid/v1";

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
    if (lobbyConnection != null) {
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

      let channelPingInterval: number | undefined;
      const channel = peerConnection.createDataChannel("Client data channel", {
        maxRetransmits: 0,
        protocol: "json",
        ordered: false,
        negotiated: false
      });
      channel.onopen = () => {
        const handles = createChannelHandles<ClientMessage, LobbyMessage>(
          channel
        );
        setLobbyConnection(handles);
        //This is messed up, but by keeping sending ping packages over the channel, latency is keeped consistent and low.
        //If nothing is sent for a couple of deciseconds, latency will start to vary wildly.
        //This might have to do with my router (known to be shitty in the past)
        channelPingInterval = window.setInterval(() => {
          handles.send({
            type: "ping",
            data: { timeStamp: performance.now() }
          });
        }, 100);
      };
      channel.onclose = () => {
        clearInterval(channelPingInterval);
      };

      peerConnection.onicecandidate = event => {
        if (event.candidate != null) {
          signalClient.send({ to: lobbyName, from: clientId, data: event.candidate.toJSON() });
        }
      };
      let peerDisconnectTimeout: number | undefined;
      peerConnection.oniceconnectionstatechange = () => {
        //clear disconnect timeout if set.
        clearTimeout(peerDisconnectTimeout);
        switch (peerConnection.iceConnectionState) {
          case "completed": {
            //Connection has been made. No need to keep the connection the signal server open.
            //(Hopefully webrtc won't try to send more candidates)
            signalClient.disconnect();
            break;
          }
          case "disconnected": {
            //Give this weirdly documented state 500ms to recover before trying a reconnect from scratch;
            peerDisconnectTimeout = window.setTimeout(
              () => setLobbyConnection(undefined),
              500
            );
            break;
          }
          case "failed": {
            setLobbyConnection(undefined);
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
  }, [lobbyConnection, lobbyName]);

  return children(lobbyConnection);
}
