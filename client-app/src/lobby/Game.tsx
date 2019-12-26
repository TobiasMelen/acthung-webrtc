import React, { useCallback, useEffect, useState } from "react";
import { Player } from "./Lobby";
import LobbyLayout from "./LobbyLayout";
import SnakeCanvas from "./SnakeCanvas";
import Waiting from "./Waiting";

type Props = {
  players: Player[];
  lobbyName: string;
};

type GameState = ["waiting"];

export default function Game(props: Props) {
  const { players, lobbyName } = props;
  const [gameState, setGameState] = useState<"waiting" | "playing">("waiting");
  const killSnake = useCallback(() => {}, []);
  useEffect(() => {
    if (players.length) {
      setGameState("playing");
    }
  }, [players]);
  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}#${lobbyName}`;
  switch (gameState) {
    case "waiting": {
      return <Waiting {...props} url={url} />;
    }
    case "playing": {
      return (
        <LobbyLayout>
          <SnakeCanvas
            input={players.map(player => ({
              color: player.color,
              onCollision: killSnake,
              onTurnInput: player.onTurnInput
            }))}
          />
        </LobbyLayout>
      );
    }
  }
}
