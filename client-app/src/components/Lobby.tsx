import React, { useEffect, useState, useMemo } from "react";
import { ALL_COLORS } from "../constants";
import useLobbyConnection from "../hooks/useConnectionForLobby";
import useStateForLobby, { LobbyPlayer } from "../hooks/useStateForLobby";
import Banger from "./Banger";
import GameRound from "./GameRound";
import Layout from "./Layout";
import QrCode from "./QrCode";
import Waiting from "./Waiting";
import { GameSettingsProvider } from "./GameSettingsContext";
import Scoreboard from "./Scoreboard";

type GameState =
  | { type: "lobby" }
  | {
      type: "intermission";
      roundWinner?: LobbyPlayer;
      gameWinner?: LobbyPlayer;
      remainingTime: number;
    }
  | { type: "playing"; running: boolean; joinedPlayerIds: string[] };

const createIntermission = (
  roundWinner?: LobbyPlayer,
  gameWinner?: LobbyPlayer
): GameState => ({
  type: "intermission",
  remainingTime: 3,
  roundWinner,
  gameWinner,
});

export default function Lobby({ lobbyName }: { lobbyName: string }) {
  const connections = useLobbyConnection(lobbyName);
  const players = useStateForLobby(connections);
  return (
    <GameSettingsProvider>
      <Game lobbyName={lobbyName} players={players} />
    </GameSettingsProvider>
  );
}

export function Game({
  lobbyName,
  players,
}: {
  lobbyName: string;
  players: LobbyPlayer[];
}) {
  const [gameState, setGameState] = useState<GameState>({ type: "lobby" });

  const winningScore = useMemo(() => (players.length || 1) * 5, [players]);

  //Tick down intermissions to next round
  useEffect(() => {
    if (gameState.type !== "intermission") {
      return;
    }
    if (gameState.remainingTime) {
      const timeout = setTimeout(() => {
        setGameState({
          ...gameState,
          remainingTime: gameState.remainingTime - 1,
        });
        return () => clearTimeout(timeout);
      }, 1000);
    } else {
      //Start next round
      setGameState({
        type: "playing",
        running: true,
        joinedPlayerIds: players
          .filter((player) => player.ready)
          .map((player) => {
            player.setState("playing");
            return player.id;
          }),
      });
    }
  }, [gameState]);

  //if all players ready when in lobby, start game
  useEffect(() => {
    if (
      gameState.type === "lobby" &&
      players.length &&
      players.every((player) => player.ready)
    ) {
      setGameState(createIntermission());
    }
  }, [players, gameState.type]);

  const onSnakeDeath = (player: LobbyPlayer) => {
    if (gameState.type !== "playing") {
      return;
    }
    player.setState("dead");
    const playersInGame = players.filter((player) =>
      gameState.joinedPlayerIds.includes(player.id)
    );
    const alivePlayers = playersInGame.filter(
      (otherPlayer) => otherPlayer !== player && otherPlayer.state === "playing"
    );
    alivePlayers.forEach((otherPlayer) =>
      otherPlayer.setScore(otherPlayer.score + 1)
    );
    if (alivePlayers.length <= 1) {
      //We have a winner!
      setGameState((state) => ({ ...state, running: false }));
      const playerWithMaxScore = playersInGame.reduce((maxPlayer, player) =>
        player.score > maxPlayer.score ? player : maxPlayer
      );
      window.setTimeout(() => {
        setGameState((state) =>
          state.type === "playing"
            ? createIntermission(
                alivePlayers[0],
                playerWithMaxScore.score > winningScore
                  ? playerWithMaxScore
                  : undefined
              )
            : state
        );
      }, 1000);
    }
  };

  const gameInput = useMemo(
    () =>
      gameState.type === "playing"
        ? players
            .filter((player) => gameState.joinedPlayerIds.includes(player.id))
            .map((player) => ({
              id: player.id,
              color: player.color,
              onCollision: () => onSnakeDeath(player),
              onTurnInput: player.onTurnInput,
            }))
        : [],
    [gameState.type, players]
  );

  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}#${lobbyName}`;
  switch (gameState.type) {
    case "lobby": {
      return <Waiting players={players} url={url} />;
    }
    case "playing": {
      return (
        <Layout>
          <GameRound input={gameInput} run={gameState.running} />
          <Scoreboard players={players} url={url} />
        </Layout>
      );
    }
    case "intermission": {
      const message =
        gameState.gameWinner != null ? (
          <>
            <span style={{ color: gameState.gameWinner.color }}>
              {gameState.gameWinner.name}
            </span>{" "}
            wins the game!
          </>
        ) : gameState.remainingTime <= 5 ? (
          `${gameState.roundWinner ? "Next round" : "Game starts"} in ${
            gameState.remainingTime
          }`
        ) : gameState.roundWinner ? (
          <>
            <span style={{ color: gameState.roundWinner.color }}>
              {gameState.roundWinner.name}
            </span>{" "}
            survives
          </>
        ) : (
          "Get ready"
        );
      return (
        <Layout>
          <Banger startingEm={30}>{message}</Banger>
        </Layout>
      );
    }
  }
}
