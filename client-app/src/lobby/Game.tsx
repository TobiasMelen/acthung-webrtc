import React, { useCallback, useEffect, useState, useMemo } from "react";
import { LobbyPlayer } from "./Lobby";
import LobbyLayout from "./LobbyLayout";
import SnakeCanvas from "./SnakeCanvas";
import Waiting from "./Waiting";
import useSecondTicker from "../useSecondTicker";

type Props = {
  players: LobbyPlayer[];
  lobbyName: string;
};

type GameState =
  | { type: "waiting" }
  | { type: "playing"; joinedPlayerIds: string[] };

export default function Game(props: Props) {
  const { players, lobbyName } = props;
  const [gameState, setGameState] = useState<GameState>({ type: "waiting" });
  const countdown = useSecondTicker();
  useEffect(() => {
    if (gameState.type !== "waiting") {
      return;
    }
    if (players.length && players.every(player => player.ready)) {
      countdown.start(5);
      countdown.onDone(() => {
        players.forEach(player => player.setState("playing"));
        setGameState({
          type: "playing",
          joinedPlayerIds: players.map(player => player.id)
        });
      });
    } else {
      countdown.pause();
    }
  }, [players]);
  const snakeKiller = useCallback(
    (player: LobbyPlayer) => () => {
      player.setState("dead");
      const alivePlayers = players.filter(
        otherPlayer => otherPlayer !== player && otherPlayer.state !== "dead"
      );
      alivePlayers.forEach(otherPlayer =>
        otherPlayer.setScore(otherPlayer.score + 1)
      );
      if (alivePlayers.length <= 1) {
        //We have a winner!
        setGameState({ type: "waiting" });
      }
    },
    [players]
  );
  const gameInput = useMemo(
    () =>
      gameState.type === "playing"
        ? players
            .filter(player => gameState.joinedPlayerIds.includes(player.id))
            .map(player => ({
              color: player.color,
              onCollision: snakeKiller(player),
              onTurnInput: player.onTurnInput
            }))
        : [],
    [gameState, players]
  );
  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}#${lobbyName}`;
  switch (gameState.type) {
    case "waiting": {
      return <Waiting {...props} url={url} />;
    }
    case "playing": {
      return (
        <LobbyLayout>
          <SnakeCanvas input={gameInput} />
        </LobbyLayout>
      );
    }
  }
}
