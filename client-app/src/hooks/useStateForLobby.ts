import { useState, useMemo, useRef, useEffect } from "react";
import { PlayerConnections } from "./useConnectionForLobby";
import useEffectWithDeps from "./useEffectWithDeps";
import { ALL_COLORS } from "../constants";
import { extractObjectDiff } from "../utility";

type PlayerStates = { [id: string]: LobbyPlayer };

type PlayerFunctions = {
  setState(state: PlayerState["state"]): void;
  setScore(score: number): void;
  onTurnInput(callBack: (turn: number) => void): void;
};

export type LobbyPlayer = PlayerState & PlayerFunctions & { id: string };


const getColorAvailability = (assignedColors: string[] = []) =>
  ALL_COLORS.reduce((acc, color) => {
    acc[color] = assignedColors.indexOf(color) === -1;
    return acc;
  }, {} as { [color: string]: boolean });

/*
 * The Lobby component is responsible for converting webrtc channels into player objects with state and client messaging.
 */
export default function useStateForLobby(clientConnections: PlayerConnections) {
  const createPlayerModifier = (playerKey: string) => (
    fn: (prev: LobbyPlayer) => LobbyPlayer
  ) =>
    setPlayerState(({ [playerKey]: player, ...otherPlayers }) => ({
      ...otherPlayers,
      [playerKey]: fn(player)
    }));

  const [playerStates, setPlayerState] = useState<PlayerStates>({});
  const [gameState, setGameState] = useState<GameState>({
    colorAvailability: getColorAvailability()
  });

  //Create players from connections
  useEffectWithDeps(
    prevDeps => {
      const [prevConnections] = prevDeps ?? [{}];
      //if we get new players, we should update colors.
      let updatedColorAvailability: typeof gameState["colorAvailability"];
      setPlayerState(playerStates => {
        let queuespot = 1;
        return Object.keys(clientConnections).reduce((acc, connKey, index) => {
          const prevPlayerState = playerStates[connKey];
          const modifyPlayer = createPlayerModifier(connKey);
          let playerState =
            prevPlayerState ??
            (() => {
              updatedColorAvailability = updatedColorAvailability ?? {
                ...gameState.colorAvailability
              };
              //Create new player if color can be assigned.
              const assignedColor = Object.entries(
                updatedColorAvailability
              ).find(([_color, avail]) => avail)?.[0];
              if (assignedColor != null) {
                updatedColorAvailability[assignedColor] = false;
                return {
                  id: connKey,
                  name: `Player ${index + 1}`,
                  color: assignedColor,
                  ready: false,
                  score: 0,
                  state: "joining",
                  latency: 0,
                  //By saving the functions here they will be in data communicated through datachannel.
                  //JSON stringify will fix it further down the line, but it's still a bit shoddy.
                  setState: (state: PlayerState["state"]) =>
                    modifyPlayer(player => ({ ...player, state })),
                  setScore: (score: number) =>
                    modifyPlayer(player => ({ ...player, score })),
                  onTurnInput: turner =>
                    clientConnections[connKey]?.on("turn", turner)
                } as LobbyPlayer;
              }
            })();
          //Connection has no player and no player could be assigned
          if (playerState == null) {
            clientConnections[connKey].send("err", {
              reason: "lobbyFull",
              queuespot
            });
            queuespot++;
            return acc;
          }
          //Wire or re-wire player message handlers for new players or connections
          const currentConnection = clientConnections[connKey];
          if (
            prevPlayerState == null ||
            currentConnection !== prevConnections[connKey]
          ) {
            currentConnection.on("setColor", color => {
              modifyPlayer(player => ({ ...player, color }));
            });
            currentConnection.on("setName", name => {
              modifyPlayer(player => ({ ...player, name }));
            });
            currentConnection.on("setReady", ready => {
              modifyPlayer(player => ({ ...player, ready }));
            });
            playerState = {
              ...playerState,
              onTurnInput: turner =>
                clientConnections[connKey]?.on("turn", turner)
            };
          }
          acc[connKey] = playerState;
          return acc;
        }, {} as typeof playerStates);
      });
    },
    [clientConnections] as const
  );

  //Update gamestate colors from player-updates
  const assignedColors = Object.values(playerStates).map(
    player => player.color
  );
  useEffect(() => {
    setGameState(gameState => ({
      ...gameState,
      colorAvailability: getColorAvailability(assignedColors)
    }));
  }, [assignedColors.join(":")]);

  //Report individual playerstates to clients
  useEffectWithDeps(
    prevDeps => {
      const [prevClientConnections, prevPlayerStates] = prevDeps ?? [];
      Object.keys(playerStates).forEach(key => {
        const newState = playerStates[key];
        const oldState = prevPlayerStates?.[key];
        //send complete state if connection changed or state is new
        if (
          clientConnections[key] != prevClientConnections?.[key] ||
          oldState == null
        ) {
          clientConnections[key]?.send("playerState", newState);
        }
        //send partial state updates to existing connections
        else if (newState !== oldState) {
          clientConnections[key]?.send(
            "playerState",
            extractObjectDiff(oldState, newState, "function")
          );
        }
      });
    },
    [clientConnections, playerStates] as const
  );

  //Report gamestate to clients
  useEffectWithDeps(
    prevDeps => {
      const [prevClientConnections, prevGameState] = prevDeps ?? [];
      const stateUpdate =
        prevGameState !== gameState &&
        extractObjectDiff(prevGameState, gameState);
      Object.keys(clientConnections).forEach(id => {
        const currentConn = clientConnections[id];
        //Send complete state to new/updated connections
        if (currentConn != prevClientConnections?.[id]) {
          currentConn?.send("gameState", gameState);
        }
        //Otherwise send updated state keys only
        else if (stateUpdate) {
          currentConn?.send("gameState", stateUpdate);
        }
      });
    },
    [clientConnections, gameState] as const
  );

  const players = useMemo(() => Object.values(playerStates), [playerStates]);

  return players;
}