import { useState, useMemo } from "react";
import { PlayerState, GameState } from "../connection/commonConnections";
import { PlayerConnections } from "../connection/LobbyConnection";
import useEffectWithDeps from "../useEffectWithDeps";
import { ALL_COLORS } from "../constants";
import { extractObjectDiff, typedEntries } from "../utility";

type PlayerStates = { [id: string]: PlayerState };

type PlayerFunctions = {
  setState(state: PlayerState["state"]): void;
  setScore(score: number): void;
  onTurnInput(callBack: (turn: number) => void): void;
};

export type LobbyPlayer = PlayerState & PlayerFunctions & { id: string };

type Props = {
  clientConnections: PlayerConnections;
  children(players: LobbyPlayer[]): JSX.Element;
};

/*
 * The Lobby component is responsible for converting webrtc channels into player objects with state and client messaging.
 */
export default function Lobby({ clientConnections, children }: Props) {
  const createPlayerModifier = (playerKey: string) => (
    fn: (prev: PlayerState) => PlayerState
  ) =>
    setPlayerState(({ [playerKey]: player, ...otherPlayers }) => ({
      ...otherPlayers,
      [playerKey]: fn(player)
    }));

  const [playerStates, setPlayerState] = useState<PlayerStates>({});
  const [gameState, setGameState] = useState<GameState>({
    colorAvailability: ALL_COLORS.reduce((acc, color) => {
      acc[color] = true;
      return acc;
    }, {} as { [color: string]: boolean })
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
          if (prevPlayerState != null) {
            //Connection already assigned player
            acc[connKey] = prevPlayerState;
          } else {
            updatedColorAvailability = updatedColorAvailability ?? {
              ...gameState.colorAvailability
            };
            //Create new player if color can be assigned.
            const assignedColor = Object.entries(updatedColorAvailability).find(
              ([_color, avail]) => avail
            )?.[0];
            if (assignedColor != null) {
              updatedColorAvailability[assignedColor] = false;
              acc[connKey] = {
                name: `Player ${index + 1}`,
                color: assignedColor,
                ready: false,
                score: 0,
                state: "joining",
                latency: 0
              };
            } else {
              clientConnections[connKey].send("err", {
                reason: "lobbyFull",
                queuespot
              });
              queuespot++;
            }
          }
          //if colors where updated by new player creation set this to gamestate
          updatedColorAvailability &&
            setGameState({ colorAvailability: updatedColorAvailability });
          //Wire or re-wire player message handlers
          const currentConnection = clientConnections[connKey];
          if (
            prevPlayerState == null ||
            currentConnection !== prevConnections[connKey]
          ) {
            const modifyPlayer = createPlayerModifier(connKey);
            currentConnection.on("setColor", color => {
              //only accept existing, non assigned, colors
              if (gameState.colorAvailability[color]) {
                modifyPlayer(player => {
                  //assign selected color in gamestate, nesting setStates like an outlaw
                  //this should probably be another reactive effect, but come on.
                  setGameState(state => ({
                    ...state,
                    colorAvailability: {
                      ...state.colorAvailability,
                      [player.color]: true,
                      [color]: false
                    }
                  }));
                  return { ...player, color };
                });
              }
            });
            currentConnection.on("setName", name => {
              modifyPlayer(player => ({ ...player, name }));
            });
            currentConnection.on("setReady", ready => {
              modifyPlayer(player => ({ ...player, ready }));
            });
          }
          return acc;
        }, {} as typeof playerStates);
      });
    },
    [clientConnections] as const
  );

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
            extractObjectDiff(oldState, newState)
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

  //Create player handler functions in a seperate memo to prevent too much closure generation on score changes.
  const playerKeys = Object.keys(playerStates);
  const playerFunctions = useMemo<{ [id: string]: PlayerFunctions }>(
    () =>
      playerKeys.reduce((acc, key) => {
        const modifyPlayer = createPlayerModifier(key);
        acc[key] = {
          setState: (state: PlayerState["state"]) =>
            modifyPlayer(player => ({ ...player, state })),
          setScore: (score: number) =>
            modifyPlayer(player => ({ ...player, score })),
          onTurnInput: turner => clientConnections[key]?.on("turn", turner)
        };
        return acc;
      }, {} as { [id: string]: PlayerFunctions }),
    [clientConnections, playerKeys.join()]
  );

  //Create players for game, this is still a bit unnessecary work for every time someone scores.
  const players = useMemo<LobbyPlayer[]>(
    () =>
      playerKeys.map(key => ({
        id: key,
        ...playerStates[key],
        ...playerFunctions[key]
      })),
    [playerFunctions, playerStates]
  );

  return children(players);
}
