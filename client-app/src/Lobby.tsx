import React from "react";
import LobbyConnection from "./connection/LobbyDataChannels";
import SnakeCanvas from "./SnakeCanvas";
import QrCode from "./QrCode";

type Props = {
  path: string;
  lobbyName?: string;
};

export default function Lobby({ lobbyName = "new" }: Props) {
  return (
    <LobbyConnection lobbyName={lobbyName}>
      {channels =>
        channels.length ? (
          <SnakeCanvas
            input={[
              {
                color: "#0F0",
                onCollision() {
                  console.log("collided!");
                }
              }
            ]}
          />
        ) : (
          <>
            <h1>Waiting for players</h1>
            <QrCode value={`${window.location.protocol}//${window.location.host}/${lobbyName}`} />
          </>
        )
      }
    </LobbyConnection>
  );
}
