import ClientDataChannel, {
  ConnectionToLobby
} from "../connection/ClientConnection";
import React, {
  useMemo,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useCallback,
  useRef
} from "react";
import SnakeControls from "./PlayerUI";
import { PlayerState, MessageData } from "../connection/commonConnections";
import usePingLatency from "./usePingLatency";
import PlayerLayout from "./PlayerLayout";
import Input from "./Input";
import { SubHeading, MainHeading } from "../Layout";
import {
  ALL_COLORS,
  DEFAULT_COLOR,
  DEFAULT_FONT_FAMILY_MONOSPACE
} from "../constants";
import Button from "../Button";

type Props = {
  lobbyName: string;
};

type SendType = Parameters<ConnectionToLobby["send"]>[0];

type ClientPlayer = ReturnType<ReturnType<typeof createPlayerFunctions>> &
  PlayerState & { latency: number };

const createPlayerFunctions = (
  setPlayerState: Dispatch<SetStateAction<PlayerState | undefined>>,
  connection?: ConnectionToLobby
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
    setName: sender("setName", "name"),
    setColor: sender("setColor"),
    setReady: sender("setReady"),
    setTurn: sender("turn")
  };
};

function PlayerCreator({
  connection,
  children
}: {
  connection?: ConnectionToLobby;
  children: (player?: ClientPlayer) => JSX.Element;
}) {
  const latency = usePingLatency(connection);
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
  return children(
    playerState && { ...playerState, ...playerFunctions, latency }
  );
}

export default function Client({ lobbyName = "new" }: Props) {
  return (
    <PlayerLayout>
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
                    <SnakeControls
                      setTurn={player.setTurn}
                      color={player.color}
                      latency={player.latency}
                    />
                  );
                case "dead":
                  return <h1>You dead</h1>;
              }
            }}
          </PlayerCreator>
        )}
      </ClientDataChannel>
    </PlayerLayout>
  );
}

function EnterCreds(props: ClientPlayer) {
  const [hasInput, setHasInput] = useState(false);
  const hasDefaultName = !hasInput && props.name.startsWith("Player ");
  const onChangeInput = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setHasInput(true);
      props.setName(ev.target.value);
    },
    [props.setName]
  );
  const inputRef = useRef<HTMLInputElement>(null);
  // useEffect(() => {
  //   hasDefaultName && inputRef.current != null && inputRef.current.focus();
  // }, [hasDefaultName, inputRef.current]);
  return (
    <>
      <div />
      <article
        style={{ textAlign: "center", maxWidth: "95%", margin: "auto 0" }}
      >
        <MainHeading>Welcome!</MainHeading>
        <SubHeading>Set name and color.</SubHeading>
        <Input
          ref={inputRef}
          style={{ color: props.color, margin: "1em auto", maxWidth: "75%" }}
          value={hasDefaultName ? "" : props.name}
          onChange={onChangeInput}
          placeholder={hasDefaultName ? props.name : ""}
          maxLength={12}
          autoCorrect="off"
          spellCheck={false}
        />
        <section
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            flexWrap: "wrap",
            justifyContent: "center"
          }}
        >
          {ALL_COLORS.map(color => (
            <figure
              onClick={() => props.setColor(color)}
              style={{
                boxSizing: "border-box",
                width: 50,
                height: 50,
                margin: 15,
                borderRadius: "50%",
                background: color,
                transform: color === props.color ? "scale(1.2)" : undefined,
                transition: "transform 150ms ease-out, border 150ms ease-out",
                border:
                  color === props.color ? `5px solid ${DEFAULT_COLOR}` : "none"
              }}
            >
              <figcaption style={{ visibility: "hidden" }}>{color}</figcaption>
            </figure>
          ))}
        </section>
        {/* {props.latency != 0 && (
          <section style={{fontWeight: 900, margin: "1em 0"}}>
            Connection delay{" "}
            <strong style={{ minWidth: "3em", fontFamily: DEFAULT_FONT_FAMILY_MONOSPACE, color:props.latency < 30
              ? "#0f0"
              : props.latency < 100
              ? "yellow"
              : "red"  }}>{props.latency}ms</strong>
          </section>
        )} */}
        <section style={{ marginTop: "1.5em" }}>
          <Button color={props.color} onClick={() => props.setReady(true)}>
            Ready!
          </Button>
        </section>
      </article>
      <div />
    </>
  );
}
