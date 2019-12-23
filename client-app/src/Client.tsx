import ClientDataChannel from "./connection/ClientDataChannel";
import React, { useMemo } from "react";
import PlayerUI from "./PlayerUI";

type Props = {
  path: string;
  lobbyName?: string;
};

export default function Client({ lobbyName = "new" }: Props) {
  return (
    <ClientDataChannel lobbyName={lobbyName}>
      {channel => {
        const setTurn = useMemo(
          () =>
            channel &&
            ((turn: number) => {
              channel.send(`${turn}`);
            }),
          [channel]
        );
        return channel && setTurn ? (
          <PlayerUI setTurn={setTurn} color="" />
        ) : (
          <h1>Connecting</h1>
        );
      }}
    </ClientDataChannel>
  );
}
