import React, { useEffect, useState } from "react";
import { ALL_COLORS } from "../constants";
import useLobbyConnection from "../hooks/useConnectionForLobby";
import useSecondTicker from "../hooks/useSecondTicker";
import useStateForLobby, { LobbyPlayer } from "../hooks/useStateForLobby";
import Banger from "./Banger";
import GameRound from "./GameRound";
import Layout from "./Layout";
import QrCode from "./QrCode";
import Waiting from "./Waiting";

const winningScore = 20;

type GameState =
  | { type: "waiting" }
  | { type: "countdown" }
  | { type: "message"; message: string }
  | { type: "playing"; running: boolean; joinedPlayerIds: string[] }
  | { type: "roundOver"; winner?: LobbyPlayer }
  | { type: "gameOver"; winner: LobbyPlayer };

export default function Lobby({ lobbyName }: { lobbyName: string }) {
  const connections = useLobbyConnection(lobbyName);
  const players = useStateForLobby(connections);
  return <Game lobbyName={lobbyName} players={players} />;
}

export function Game({
  lobbyName,
  players
}: {
  lobbyName: string;
  players: LobbyPlayer[];
}) {
  const [gameState, setGameState] = useState<GameState>({ type: "waiting" });
  const countdown = useSecondTicker();
  useEffect(() => {
    if (!players.length && gameState.type !== "waiting") {
      setGameState({ type: "waiting" });
      return;
    }
    if (
      gameState.type === "waiting" &&
      players.length &&
      players.every(player => player.ready)
    ) {
      let countdownRef: number;
      countdownRef = window.setTimeout(() => {
        setGameState({ type: "message", message: "Get Ready" });
        window.setTimeout(() => {
          setGameState({
            type: "countdown"
          });
        }, 3000);
      }, 1000);
      return () => {
        window.clearTimeout(countdownRef);
      };
    }
    if (gameState.type === "roundOver") {
      const startCountdown = window.setTimeout(() => {
        setGameState({ type: "countdown" });
      }, 2500);
      return () => window.clearTimeout(startCountdown);
    }
    if (gameState.type === "countdown") {
      !countdown.isRunning && countdown.start(5);
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
        <Layout>
          <GameRound input={gameInput} run={gameState.running}>
            <FixedStats players={players} url={url} />
          </GameRound>
        </Layout>
      );
    }
    case "roundOver": {
      return (
        <Layout>
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
        </Layout>
      );
    }
    case "gameOver": {
      return (
        <Banger>
          <span style={{ color: gameState.winner.color }}>
            {gameState.winner.name}
          </span>{" "}
          wins the game
        </Banger>
      );
    }
    case "message": {
      return (
        <Banger startingEm={gameState.message.length < 25 ? 30 : undefined}>
          {gameState.message}
        </Banger>
      );
    }
    case "countdown": {
      return (
        <>
          <FixedStats players={players} url={url} />
          <DisplayCountDown count={countdown.secondsLeft}>
            {players.every(player => player.score === 0)
              ? "Game starts"
              : "Next round"}{" "}
            in{" "}
          </DisplayCountDown>
        </>
      );
    }
  }
}

const DisplayCountDown = ({
  count,
  children
}: {
  count: number;
  children: React.ReactNode;
}) => {
  const [color] = useState(
    ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
  );
  return (
    <Banger
      key="countdown"
      adjustWithChildren={false}
      style={{ maxWidth: "60%" }}
    >
      {children}
      <span style={{ display: "inline-block", width: "0.8em" }}>{count}</span>
    </Banger>
  );
};

const FixedStats = ({
  players,
  url
}: {
  players: LobbyPlayer[];
  url: string;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: -1,
        right: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%"
      }}
    >
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "flex-end"
        }}
      >
        {players.map(player => (
          <div
            style={{
              color: player.color,
              textAlign: "right",
              margin: "0 1.5em",
              paddingBottom: "2em"
            }}
          >
            <div style={{ fontSize: "5.2em" }}>{player.score}</div>
            <div style={{ fontSize: "1.2em", whiteSpace: "nowrap" }}>
              {player.name}
            </div>
          </div>
        ))}
      </div>
      {ALL_COLORS.length > players.length && (
        <QrCode
          colorScheme="onWhiteBg"
          padding={2}
          style={{
            width: 200,
            height: 200,
            margin: "2em"
          }}
        >
          {url}
        </QrCode>
      )}
    </div>
  );
};
