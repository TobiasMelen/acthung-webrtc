import ClientDataChannel, {
  LobbyConnection
} from "../connection/ClientConnection";
import React, {
  useMemo,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useCallback
} from "react";
import PlayerUI from "./PlayerUI";
import { PlayerState, MessageData } from "../connection/commonConnections";

type Props = {
  lobbyName: string;
};

type SendType = Parameters<LobbyConnection["send"]>[0];

type ClientPlayer = ReturnType<ReturnType<typeof createPlayerFunctions>> &
  PlayerState;

const createPlayerFunctions = (
  setPlayerState: Dispatch<SetStateAction<PlayerState | undefined>>,
  connection?: LobbyConnection
) => () => {
  const sender = <TKey extends SendType["type"]>(
    type: TKey,
    stateKey?: keyof PlayerState
  ) => (data: MessageData<SendType, TKey>) => {
    //Optimistic updates if statekey provided
    stateKey &&
      setPlayerState(state => state && { ...state, [stateKey]: data });
    connection?.send(
      //@ts-ignore Come-on typescript, be the haskell of my dreams
      { type, data }
    );
  };
  return {
    setColor: sender("setColor"),
    setName: sender("setName"),
    setReady: sender("setReady"),
    setTurn: sender("turn")
  };
};

function PlayerCreator({
  connection,
  children
}: {
  connection?: LobbyConnection;
  children: (player?: ClientPlayer) => JSX.Element;
}) {
  const [playerState, setPlayerState] = useState<PlayerState>();
  useEffect(() => {
    if (connection == null) {
      return;
    }
    connection.on("playerState", setPlayerState);
  }, [connection]);
  const playerFunctions = useMemo(
    createPlayerFunctions(setPlayerState, connection),
    [connection]
  );
  return children(playerState && { ...playerState, ...playerFunctions });
}

export default function Client({ lobbyName = "new" }: Props) {
  return (
    <ClientDataChannel lobbyName={lobbyName}>
      {channel => (
        <PlayerCreator connection={channel}>
          {player => {
            if (player == null) {
              return <h1>Connecting</h1>;
            }
            switch (player.state) {
              case "joining":
                return player.ready ? (
                  <h1>Waiting</h1>
                ) : (
                  <EnterCreds {...player} />
                );
              case "playing":
                return (
                  <PlayerUI setTurn={player.setTurn} color={player.color} />
                );
              case "dead":
                return <h1>You dead</h1>;
            }
          }}
        </PlayerCreator>
      )}
    </ClientDataChannel>
  );
}

function EnterCreds(props: ClientPlayer) {
  const onChangeInput = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      props.setName(ev.target.value);
    },
    [props.setName]
  );
  return (
    <main>
      <h2>{props.latency}</h2>
      <input value={props.name} onChange={onChangeInput} />
    </main>
  );
}
