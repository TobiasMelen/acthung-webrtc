import React, { useEffect } from "react";
import io from "socket.io-client";

type Props = {
  lobbyName: string;
};

export default function LobbyConnection({ lobbyName }: Props) {
  useEffect(() => {
    const client = io(`http://localhost:8080`);
    client.connect();
  }, []);
  return <></>;
}
