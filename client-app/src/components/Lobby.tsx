import React, { useEffect, useState, useMemo } from "react";
import useLobbyConnection from "../hooks/useConnectionForLobby";
import useStateForLobby, { LobbyPlayer } from "../hooks/useStateForLobby";
import Banger from "./Banger";
import GameRound from "./GameRound";
import Layout from "./Layout";
import Waiting from "./Waiting";
import { GameSettingsProvider } from "./GameSettingsContext";
import Scoreboard from "./Scoreboard";

type PlayerInfo = Pick<LobbyPlayer, "color" | "name">;

type GameState =
  | { type: "lobby" }
  | {
      type: "intermission";
      roundWinner?: PlayerInfo;
      gameWinner?: PlayerInfo;
      remainingTime: number;
    }
  | { type: "playing"; running: boolean; joinedPlayerIds: string[] };

const createIntermission = (
  roundWinner?: PlayerInfo,
  gameWinner?: PlayerInfo
): GameState => ({
  type: "intermission",
  remainingTime: 5,
  roundWinner,
  gameWinner,
});

export default function Lobby({ lobbyName }: { lobbyName: string }) {
  const [socketStatus, connections] = useLobbyConnection(lobbyName);
  const [players, gameState] = useStateForLobby(connections);
  if (socketStatus === "connecting") {
    return (
      <Banger style={{ animation: "fadeIn 300ms 750ms both" }}>
        Signaling server is <span style={{ color: "yellow" }}>warming</span> up.{" "}
        <br />
        <small style={{ fontSize: "0.5em" }}>
          This will take a while <br /> (free tier hosting)
        </small>
      </Banger>
    );
  }
  if (socketStatus === "failed") {
    return (
      <Banger>
        Signaling server connection <span style={{ color: "red" }}>failed</span>{" "}
      </Banger>
    );
  }
  return (
    <GameSettingsProvider>
      <Game
        lobbyName={lobbyName}
        players={players}
        allowSinglePlayer={gameState.allowSinglePlayer}
      />
    </GameSettingsProvider>
  );
}

export function Game({
  lobbyName,
  allowSinglePlayer = false,
  players,
}: {
  lobbyName: string;
  players: LobbyPlayer[];
  allowSinglePlayer: boolean;
}) {
  const [gameState, setGameState] = useState<GameState>({ type: "lobby" });

  const winningScore = useMemo(
    () => (players.length || 1) * 5,
    [players.length]
  );

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

  //Player join effect
  useEffect(() => {
    //if all players ready when in lobby, start game
    if (
      gameState.type === "lobby" &&
      players.length &&
      (players.length > 1 || allowSinglePlayer) &&
      players.every((player) => player.ready)
    ) {
      setGameState(createIntermission());
    }
    //Go back to lobby, if no ready players are joined.
    if (gameState.type !== "lobby" && !players.some((player) => player.ready)) {
      setGameState({ type: "lobby" });
    }
  }, [players, gameState.type]);

  //Group all joined and alive players
  const playersInGame = useMemo(() => {
    if (gameState.type !== "playing") {
      return null;
    }
    const joined = players.filter((player) =>
      gameState.joinedPlayerIds.includes(player.id)
    );
    return {
      joined,
      alive: joined.filter((otherPlayer) => otherPlayer.state === "playing"),
    };
  }, [gameState.type, players]);

  //Finish ongoing round if someone won or no ones alive or playing
  useEffect(() => {
    if (!playersInGame) {
      return;
    }
    const aliveCount = playersInGame.alive.length;
    //Allow one player to skrrrt around without declaring them victor.
    const isOneAliveButSinglePlayer =
      aliveCount === 1 && playersInGame.joined.length === 1;
    if (aliveCount <= 1 && !isOneAliveButSinglePlayer) {
      //We have a winner!
      setGameState((state) => ({ ...state, running: false }));
      const playerWithMaxScore = playersInGame.joined.reduce(
        (maxPlayer, player) =>
          player.score > (maxPlayer?.score ?? 0) ? player : maxPlayer,
        null as LobbyPlayer | null
      );
      window.setTimeout(() => {
        setGameState((state) =>
          state.type === "playing"
            ? createIntermission(
                playersInGame.alive[0] ?? { color: "inherit", name: "Nobody" },
                (playerWithMaxScore?.score ?? 0) > winningScore
                  ? (playerWithMaxScore as LobbyPlayer)
                  : undefined
              )
            : state
        );
      }, 1000);
    }
  }, [playersInGame]);

  //When someone crashes, set state to that player as crashed and give everyone else a score.
  const onSnakeDeath = (player: LobbyPlayer) => {
    if (playersInGame == null) {
      return;
    }
    player.setState("dead");
    playersInGame.alive
      .filter((p) => p.id !== player.id)
      .forEach((otherPlayer) => otherPlayer.setScore(otherPlayer.score + 1));
  };

  //Create new input for game when players changes.
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
      const intermissionMessage =
        gameState.gameWinner != null ? (
          <Banger>
            <span style={{ color: gameState.gameWinner.color }}>
              {gameState.gameWinner.name}
            </span>{" "}
            wins the game!
          </Banger>
        ) : gameState.remainingTime <= 3 ? (
          <Banger key="countdown">
            {gameState.roundWinner ? "Next round" : "Game starts"} in{" "}
            <span style={{ width: "1em", display: "inline-block" }}>
              {gameState.remainingTime}
            </span>
          </Banger>
        ) : gameState.roundWinner ? (
          <Banger>
            <span
              style={{
                color: gameState.roundWinner.color,
              }}
            >
              {gameState.roundWinner.name}
            </span>{" "}
            survives
          </Banger>
        ) : (
          <Banger>Get ready</Banger>
        );
      return (
        <Layout key={gameState.remainingTime > 3 ? "message" : "countdown"}>
          {intermissionMessage}
        </Layout>
      );
    }
  }
}
