import ClientDataChannel, {
  LobbyConnection
} from "../connection/ClientConnection";
import React, { useMemo } from "react";
import PlayerUI from "./PlayerUI";

type Props = {
  lobbyName: string;
};

function PlayerMapper({ connection }: { connection?: LobbyConnection }) {
  
}

export default function Client({ lobbyName = "new" }: Props) {
  return (
    <ClientDataChannel lobbyName={lobbyName}>
      {channel => {
        const setTurn = useMemo(
          () =>
            channel &&
            ((turn: number) => {
              channel.send({ type: "turn", data: turn });
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
