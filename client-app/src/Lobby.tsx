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
            input={channels.map(channel => ({
              color: "#0F0",
              onCollision() {
                console.log("collided!");
              },
              onTurnInput: turner => {
                channel.onmessage = ev => {
                  console.log(ev);
                  const turn = parseFloat(ev.data);
                  turn != null && turner(turn);
                };
              }
            }))}
          />
        ) : (
          <>
            <h1>Waiting for players</h1>
            <QrCode
              value={`${window.location.protocol}//${window.location.host}/${lobbyName}`}
            />
          </>
        )
      }
    </LobbyConnection>
  );
}
