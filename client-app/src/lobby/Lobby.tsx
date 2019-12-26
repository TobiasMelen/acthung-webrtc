import { useState, useMemo } from "react";
import { PlayerState } from "../connection/commonConnections";
import { ClientConnections } from "../connection/LobbyConnection";
import useEffectWithDeps from "../useEffectWithDeps";

const allColors = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#fff"];

type PlayerStates = { [id: string]: PlayerState };

type PlayerFunctions = {
  setState(state: PlayerState["state"]): void;
  setScore(score: number): void;
  onTurnInput(callBack: (turn: number) => void): void;
};

export type LobbyPlayer = PlayerState & PlayerFunctions;

type Props = {
  clientConnections: ClientConnections;
  children(players: LobbyPlayer[]): JSX.Element;
};

function createColorAvailabilityChecker(...collections: PlayerStates[]) {
  return (color: string) =>
    collections.every(collection =>
      Object.keys(collection).every(key => collection[key].color !== color)
    );
}

/*
 * The Lobby component is responsible for converting webrtc channels into player objects with state and client messaging.
 */
export default function Lobby({ clientConnections, children }: Props) {
  const createPlayerModifier = (playerKey: string) => (
    fn: (prev: PlayerState) => PlayerState
  ) =>
    setPlayerState(state => ({
      ...state,
      [playerKey]: fn(state[playerKey])
    }));

  const [playerStates, setPlayerState] = useState<PlayerStates>({});

  //Create players from connections
  useEffectWithDeps(
    prevDeps => {
      const [prevConnections] = prevDeps ?? [{}];
      setPlayerState(playerStates => {
        let queuespot = 1;
        return Object.keys(clientConnections).reduce((acc, connKey, index) => {
          const prevPlayerState = playerStates[connKey];
          if (prevPlayerState != null) {
            //Connection already assigned player
            acc[connKey] = prevPlayerState;
          } else {
            //Create new player if color can be assigned.
            const checkColorAvailability = createColorAvailabilityChecker(
              acc,
              playerStates
            );
            const assignedColor = allColors.find(checkColorAvailability);
            if (assignedColor != null) {
              acc[connKey] = {
                name: `Player ${index + 1}`,
                color: assignedColor,
                ready: false,
                score: 0,
                state: "joining"
              };
            } else {
              clientConnections[connKey].send({
                type: "err",
                data: { reason: "lobbyFull", queuespot }
              });
              queuespot++;
            }
          }
          //Wire or re-wire player message handlers
          const currentConnection = clientConnections[connKey];
          if (
            prevPlayerState == null ||
            currentConnection !== prevConnections[connKey]
          ) {
            const modifyPlayer = createPlayerModifier(connKey);
            currentConnection.on("setColor", color =>
              modifyPlayer(player => ({ ...player, color }))
            );
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

  //Report any changes in playerstate to client
  useEffectWithDeps(
    prevDeps => {
      const prevPlayerStates = prevDeps?.[0] ?? {};
      Object.keys(playerStates).forEach(key => {
        const newState = playerStates[key];
        const oldState = prevPlayerStates[key];
        if (newState != oldState) {
          clientConnections[key].send({ type: "playerState", data: newState });
        }
      });
    },
    /*Client connections should be in deps, but isnt to keep effect order in this comp.*/ [
      playerStates
    ]
  );

  //Create player handler functions in a seperate memo to prevent all this closure generation on score changes.
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
          onTurnInput: turner => clientConnections[key].on("turn", turner)
        };
        return acc;
      }, {} as { [id: string]: PlayerFunctions }),
    [clientConnections, playerKeys.join()]
  );

  //Create players for game, this is still a bit unnessecary work for every time someone scores.
  const players = useMemo<LobbyPlayer[]>(
    () =>
      playerKeys.map(key => ({
        ...playerStates[key],
        ...playerFunctions[key]
      })),
    [playerFunctions, playerStates]
  );

  return children(players);
}
