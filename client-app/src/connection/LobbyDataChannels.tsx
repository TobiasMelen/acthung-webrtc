import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { stunServers } from "./connectionConstants";

type Props = {
  lobbyName: string;
  children: (dataChannels: RTCDataChannel[]) => JSX.Element;
};

type SocketMessage = RTCSessionDescriptionInit;

export default function LobbyDataChannels({ lobbyName, children }: Props) {
  const [channels, setDataChannels] = useState<RTCDataChannel[]>([]);

  useEffect(() => {
    const signalClient = io(process.env.SIGNAL_URL, {
      transports: ["websocket"],
      query: {
        hostLobby: lobbyName
      }
    });
    signalClient.on(
      "message",
      async ({ from, data }: { from: string; data: SocketMessage }) => {
        if (data.type === "offer") {
          const clientConnection = new RTCPeerConnection({
            iceServers: [{ urls: stunServers }]
          });
          clientConnection.ondatachannel = ({channel}) => {
            channel.onclose = () => setDataChannels(connections => connections.filter(c => c !== channel));
            setDataChannels([...channels, channel])
          };
          clientConnection.onicecandidate = event => {
            if (event.candidate != null) {
              signalClient.send({ to: from, data: event.candidate.toJSON() });
            }
          };
          signalClient.on("message", (msg: any) => {
            if (msg.from === from && "candidate" in msg?.data) {
              clientConnection.addIceCandidate(msg.data);
            }
          });
          await clientConnection.setRemoteDescription(
            new RTCSessionDescription(data)
          );
          const localDescription = await clientConnection.createAnswer();
          await clientConnection.setLocalDescription(localDescription);
          signalClient.send({ data: localDescription, to: from });
        }
      }
    );
    return () => {
      signalClient.disconnect();
    };
  }, []);
  return children?.(channels);
}
