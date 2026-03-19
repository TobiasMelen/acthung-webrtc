import React, { useEffect, useMemo, useReducer } from "react";
import useLobbyConnection from "../hooks/useConnectionForLobby";
import useStateForLobby, { LobbyPlayer } from "../hooks/useStateForLobby";
import Banger from "./Banger";
import GameRound from "./GameRound";
import Layout from "./Layout";
import Waiting from "./Waiting";
import { GameSettingsProvider } from "./GameSettingsContext";
import Scoreboard from "./Scoreboard";
import useWakeLock from "../hooks/useWakeLock";
import VerticalCounter from "./VerticalCounter";
import useOnlineState from "../hooks/useOnlineState";
import Leaderboard from "./Leaderboard";
import useJsonBin from "../hooks/useJsonBin";

type PlayerInfo = Pick<LobbyPlayer, "color" | "name">;

type LeaderboardEntry = {
  score: number;
  name: string;
  color: string;
  timestamp: number;
};

type GameState =
  | { type: "lobby" }
  | {
      type: "intermission";
      roundWinner?: PlayerInfo;
      gameWinner?: PlayerInfo;
      remainingTime: number;
      singlePlayerScore?: number;
      singlePlayerName?: string;
      singlePlayerColor?: string;
      singlePlayerNewBest?: boolean;
      singlePlayerLeaderboard?: LeaderboardEntry[];
    }
  | { type: "playing"; joinedPlayerIds: string[] };

type GameAction =
  | { type: "PLAYERS_READY" }
  | { type: "PLAYERS_LEFT" }
  | { type: "COUNTDOWN_TICK" }
  | { type: "START_ROUND"; joinedPlayerIds: string[] }
  | { type: "ROUND_ENDED"; roundWinner?: PlayerInfo; gameWinner?: PlayerInfo }
  | {
      type: "SINGLE_PLAYER_ROUND_ENDED";
      score: number;
      name: string;
      color: string;
      newBest: boolean;
      leaderboard: LeaderboardEntry[];
    };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "PLAYERS_READY":
      if (state.type === "lobby") {
        return { type: "intermission", remainingTime: 5 };
      }
      return state;

    case "PLAYERS_LEFT":
      return { type: "lobby" };

    case "COUNTDOWN_TICK":
      if (state.type === "intermission" && state.remainingTime > 1) {
        return { ...state, remainingTime: state.remainingTime - 1 };
      }
      return state;

    case "START_ROUND":
      if (state.type === "intermission") {
        return { type: "playing", joinedPlayerIds: action.joinedPlayerIds };
      }
      return state;

    case "ROUND_ENDED":
      if (state.type === "playing") {
        return {
          type: "intermission",
          remainingTime: 5,
          roundWinner: action.roundWinner,
          gameWinner: action.gameWinner,
        };
      }
      return state;

    case "SINGLE_PLAYER_ROUND_ENDED":
      if (state.type === "playing") {
        return {
          type: "intermission",
          remainingTime: 5,
          singlePlayerScore: action.score,
          singlePlayerNewBest: action.newBest,
          singlePlayerName: action.name,
          singlePlayerColor: action.color,
          singlePlayerLeaderboard: action.leaderboard,
        };
      }
      return state;

    default:
      return state;
  }
}

export default function Lobby({ lobbyName }: { lobbyName: string }) {
  const [socketStatus, connections] = useLobbyConnection(lobbyName);
  const [players, gameState] = useStateForLobby(connections);
  useWakeLock();
  if (socketStatus === "connecting" && players.length === 0) {
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
        Signaling server connection{" "}
        <span style={{ color: "red" }}>failed</span>{" "}
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
  const [gameState, dispatch] = useReducer(gameReducer, { type: "lobby" });

  const [leaderboard, setLeaderboard] = useJsonBin<LeaderboardEntry[]>(
    `leaderboard-snake`,
    [],
    import.meta.env.VITE_LEADERBOARD_JSON_BUCKET,
  );

  const winningScore = useMemo(
    () => (players.length || 1) * 5,
    [players.length],
  );

  // Effect 1: Intermission countdown + start round
  useEffect(() => {
    if (gameState.type !== "intermission") {
      return;
    }

    const timeout = setTimeout(() => {
      if (gameState.remainingTime === 1) {
        // Time's up - start round with ready players
        const joinedPlayerIds = players.filter((p) => p.ready).map((p) => p.id);
        dispatch({ type: "START_ROUND", joinedPlayerIds });
      } else {
        dispatch({ type: "COUNTDOWN_TICK" });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [gameState, players]);

  // Effect 2: Player ready/leave detection
  useEffect(() => {
    const allReady =
      players.length > 0 &&
      (players.length > 1 || allowSinglePlayer) &&
      players.every((player) => player.ready);

    const noReadyPlayers = !players.some((player) => player.ready);

    if (gameState.type === "lobby" && allReady) {
      dispatch({ type: "PLAYERS_READY" });
    } else if (gameState.type !== "lobby" && noReadyPlayers) {
      dispatch({ type: "PLAYERS_LEFT" });
    }
  }, [players, gameState.type, allowSinglePlayer]);

  const handleRoundEnd = async (
    result:
      | {
          type: "multiplayer";
          roundWinner?: PlayerInfo;
          gameWinner?: PlayerInfo;
        }
      | { type: "singleplayer"; score: number; name: string; color: string },
  ) => {
    if (result.type === "singleplayer") {
      const newEntry: LeaderboardEntry = {
        score: result.score,
        name: result.name,
        color: result.color,
        timestamp: Date.now(),
      };

      let updatedLeaderboard: LeaderboardEntry[] = [];
      let isNewBest = false;

      await setLeaderboard((prev) => {
        const previousEntry = prev.find(
          (entry) => entry.name === result.name && entry.color === result.color,
        );
        isNewBest = newEntry.score > (previousEntry?.score ?? -1);
        updatedLeaderboard = isNewBest
          ? [
              ...prev.filter((entry) => entry !== previousEntry),
              newEntry,
            ].sort((a, b) => b.score - a.score)
          : prev;
        return updatedLeaderboard;
      });

      dispatch({
        type: "SINGLE_PLAYER_ROUND_ENDED",
        score: result.score,
        name: result.name,
        color: result.color,
        newBest: isNewBest,
        leaderboard: updatedLeaderboard.slice(0, 3),
      });
    } else {
      dispatch({
        type: "ROUND_ENDED",
        roundWinner: result.roundWinner,
        gameWinner: result.gameWinner,
      });
    }
  };

  const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}#${lobbyName}`;
  switch (gameState.type) {
    case "lobby": {
      return <Waiting players={players} url={url} />;
    }
    case "playing": {
      const joinedPlayers = players.filter((p) =>
        gameState.joinedPlayerIds.includes(p.id)
      );
      const isSinglePlayer =
        joinedPlayers.length === 1 && allowSinglePlayer;
      return (
        <Layout>
          <GameRound
            players={joinedPlayers}
            isSinglePlayer={isSinglePlayer}
            winningScore={winningScore}
            onRoundEnd={handleRoundEnd}
          />
          <Scoreboard players={players} url={url} />
        </Layout>
      );
    }
    case "intermission": {
      const intermissionMessage = (() => {
        // Single player score and leaderboard
        if (
          gameState.singlePlayerScore != null &&
          gameState.singlePlayerLeaderboard &&
          gameState.singlePlayerName &&
          gameState.singlePlayerColor
        ) {
          // Phase 1: Show score (first 2 seconds)
          if (gameState.remainingTime > 3) {
            return (
              <Banger>
                <div>
                  <span style={{ color: gameState.singlePlayerColor }}>
                    {gameState.singlePlayerScore}
                  </span>{" "}
                  {gameState.singlePlayerScore === 1 ? "point" : "points"}!
                </div>
                {gameState.singlePlayerNewBest && (
                  <div style={{ fontSize: "0.6em", marginTop: "0.5em" }}>
                    NEW BEST!
                  </div>
                )}
              </Banger>
            );
          }

          // Phase 2: Show leaderboard (last 3 seconds)
          return (
            <Layout>
              <Leaderboard
                entries={gameState.singlePlayerLeaderboard}
                playerName={gameState.singlePlayerName}
                playerColor={gameState.singlePlayerColor}
                remainingTime={gameState.remainingTime}
              />
            </Layout>
          );
        }

        // Multiplayer messages
        if (gameState.gameWinner != null) {
          return (
            <Banger>
              <span style={{ color: gameState.gameWinner.color }}>
                {gameState.gameWinner.name}
              </span>{" "}
              wins the game!
            </Banger>
          );
        }

        if (gameState.remainingTime <= 3) {
          return (
            <Banger key="countdown">
              {gameState.roundWinner ? "Next round" : "Game starts"} in{" "}
              <span style={{ width: "1em", display: "inline-block" }}>
                <VerticalCounter number={gameState.remainingTime} />
              </span>
            </Banger>
          );
        }

        if (gameState.roundWinner) {
          return (
            <Banger>
              <span style={{ color: gameState.roundWinner.color }}>
                {gameState.roundWinner.name}
              </span>{" "}
              survives
            </Banger>
          );
        }

        return <Banger>Get ready</Banger>;
      })();

      return (
        <Layout key={gameState.remainingTime > 3 ? "message" : "countdown"}>
          {intermissionMessage}
        </Layout>
      );
    }
  }
}
