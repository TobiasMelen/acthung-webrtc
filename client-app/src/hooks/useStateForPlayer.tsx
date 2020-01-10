import { MessageChannelToLobby } from "../messaging/dataChannelMessaging";
import { Dispatch, SetStateAction, useState, useEffect, useMemo } from "react";
import usePingLatency from "./usePingLatency";

type SendType = Parameters<MessageChannelToLobby["send"]>[0];

const createPlayerFunctions = (
  setPlayerState: Dispatch<SetStateAction<PlayerState | undefined>>,
  connection?: MessageChannelToLobby
) => () => {
  const sender = <TKey extends SendType>(
    type: TKey,
    stateKey?: keyof PlayerState
  ) => (data: any) => {
    //Optimistic updates if statekey provided
    stateKey &&
      setPlayerState(state => state && { ...state, [stateKey]: data });
    connection?.send(
      //@ts-ignore Come-on typescript, be the haskell of my dreams
      type,
      data
    );
  };
  return {
    setName: sender("setName", "name"),
    setColor: sender("setColor"),
    setReady: sender("setReady"),
    setTurn: sender("turn")
  };
};

export default function useStateForPlayer(connection?: MessageChannelToLobby) {
  const latency = usePingLatency(connection);
  const [playerState, setPlayerState] = useState<PlayerState>();
  const [gameState, setGameState] = useState<GameState>();
  useEffect(() => {
    if (connection == null) {
      return;
    }

    connection.on("playerState", update =>
      setPlayerState(
        state =>
          //assign undefined to the stateupdate and die.
          ({ ...state, ...update } as PlayerState)
      )
    );
    connection.on("gameState", update =>
      setGameState(
        state =>
          //same here.
          ({ ...state, ...update } as GameState)
      )
    );
  }, [connection]);

  const playerFunctions = useMemo(
    createPlayerFunctions(setPlayerState, connection),
    [connection]
  );
  return [
    playerState && { ...playerState, ...playerFunctions, latency },
    gameState
  ] as const;
}
