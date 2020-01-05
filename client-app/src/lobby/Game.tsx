import React, { useCallback, useEffect, useState, useMemo } from "react";
import { LobbyPlayer } from "./Lobby";
import LobbyLayout from "./LobbyLayout";
import GameRound from "./GameRound";
import Waiting from "./Waiting";
import useSecondTicker from "../useSecondTicker";
import Banger from "../Banger";
import QrCode from "../QrCode";
import { ALL_COLORS } from "../constants";

const winningScore = 20;

type Props = {
  players: LobbyPlayer[];
  lobbyName: string;
};

type GameState =
  | { type: "waiting" }
  | { type: "countdown" }
  | { type: "playing"; running: boolean; joinedPlayerIds: string[] }
  | { type: "roundOver"; winner?: LobbyPlayer }
  | { type: "gameOver"; winner: LobbyPlayer };

export default function Game({ players, lobbyName }: Props) {
  const [gameState, setGameState] = useState<GameState>({ type: "waiting" });
  const countdown = useSecondTicker();
  useEffect(() => {
    if (
      gameState.type === "waiting" &&
      players.length &&
      players.every(player => player.ready)
    ) {
      const startCountdown = window.setTimeout(() => {
        setGameState({ type: "countdown" });
      }, 1000);
      return () => {
        window.clearTimeout(startCountdown);
      };
    }
    if (gameState.type === "roundOver") {
      const startCountdown = window.setTimeout(() => {
        setGameState({ type: "countdown" });
      }, 4000);
      return () => window.clearTimeout(startCountdown);
    }
    if (gameState.type === "countdown") {
      countdown.start(5);
      countdown.onDone(() =>
        setGameState({
          type: "playing",
          running: true,
          joinedPlayerIds: players
            .filter(player => player.ready)
            .map(player => {
              player.setState("playing");
              return player.id;
            })
        })
      );
    }
  }, [players, gameState]);

  const onSnakeDeath = (player: LobbyPlayer) => {
    if (gameState.type !== "playing") {
      return;
    }
    player.setState("dead");
    const playersInGame = players.filter(player =>
      gameState.joinedPlayerIds.includes(player.id)
    );
    const alivePlayers = playersInGame.filter(
      otherPlayer => otherPlayer !== player && otherPlayer.state === "playing"
    );
    alivePlayers.forEach(otherPlayer =>
      otherPlayer.setScore(otherPlayer.score + 1)
    );
    if (alivePlayers.length <= 1) {
      //We have a winner!
      setGameState(state => ({ ...state, running: false }));
      const playerWithMaxScore = playersInGame.reduce((maxPlayer, player) =>
        player.score > maxPlayer.score ? player : maxPlayer
      );
      const nextState: GameState =
        playerWithMaxScore.score > winningScore
          ? { type: "gameOver", winner: playerWithMaxScore }
          : { type: "roundOver", winner: alivePlayers[0] };
      window.setTimeout(() => {
        setGameState(state => (state.type === "playing" ? nextState : state));
      }, 1000);
    }
  };

  const gameInput =
    gameState.type === "playing"
      ? players
          .filter(player => gameState.joinedPlayerIds.includes(player.id))
          .map(player => ({
            id: player.id,
            color: player.color,
            onCollision: () => onSnakeDeath(player),
            onTurnInput: player.onTurnInput
          }))
      : [];

  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}#${lobbyName}`;
  switch (gameState.type) {
    case "waiting": {
      return <Waiting players={players} url={url} />;
    }
    case "playing": {
      return (
        <LobbyLayout>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%"
            }}
          >
            <div style={{ flexGrow: 1 }}>
              {players.map(player => (
                <div
                  style={{
                    color: player.color,
                    textAlign: "right",
                    margin: "1.5em 0.75em"
                  }}
                >
                  <div style={{ fontSize: "3.5em" }}>
                    {player.score}
                  </div>
                  <div style={{ fontSize: "1em", whiteSpace: "nowrap" }}>
                    {player.name}
                  </div>
                </div>
              ))}
            </div>
            {ALL_COLORS.length > players.length && (
              <div style={{ padding: "0.5em" }}>
                <QrCode>{url}</QrCode>
              </div>
            )}
          </div>
          <GameRound input={gameInput} run={gameState.running} />
        </LobbyLayout>
      );
    }
    case "roundOver": {
      return (
        <LobbyLayout>
          <Banger key="round-over" startingEm={30}>
            {gameState.winner != null ? (
              <span style={{ color: gameState.winner.color }}>
                {gameState.winner.name}
              </span>
            ) : (
              "Nobody"
            )}{" "}
            survives
          </Banger>
        </LobbyLayout>
      );
    }
    case "gameOver": {
      return (
        <LobbyLayout>
          <Banger>
            <span style={{ color: gameState.winner.color }}>
              {gameState.winner.name}
            </span>{" "}
            wins the game
          </Banger>
        </LobbyLayout>
      );
    }
    case "countdown": {
      return (
        <LobbyLayout>
          <Banger
            key="countdown"
            adjustWithChildren={false}
            style={{ maxWidth: "70%" }}
          >
            {players.every(player => player.score === 0)
              ? "Game starts"
              : "Next round"}{" "}
            in{" "}
            <span style={{ display: "inline-block", width: "0.8em" }}>
              {countdown.secondsLeft}
            </span>
          </Banger>
        </LobbyLayout>
      );
    }
  }
}
