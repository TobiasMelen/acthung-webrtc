import ClientDataChannel from "../connection/ClientConnection";
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
import usePingLatency from "./usePingLatency";
import PlayerLayout from "./PlayerLayout";
import Input from "./Input";
import { SubHeading, MainHeading } from "../Layout";
import Button from "../Button";
import { MessageChannelToLobby } from "../messaging/dataChannelMessaging";
import Banger from "../Banger";

type Props = {
  lobbyName: string;
};

type SendType = Parameters<MessageChannelToLobby["send"]>[0];

type ClientPlayer = ReturnType<ReturnType<typeof createPlayerFunctions>> &
  PlayerState & { latency: number };

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

function PlayerCreator({
  connection,
  children
}: {
  connection?: MessageChannelToLobby;
  children: (player?: ClientPlayer, gameState?: GameState) => JSX.Element;
}) {
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
  return children(
    playerState && { ...playerState, ...playerFunctions, latency },
    gameState
  );
}

export default function Client({ lobbyName = "new" }: Props) {
  return (
    <PlayerLayout>
      <ClientDataChannel lobbyName={lobbyName}>
        {channel => (
          <PlayerCreator connection={channel}>
            {(player, gameState) => {
              if (player == null) {
                return <Banger>Connecting</Banger>;
              }
              switch (player.state) {
                case "joining":
                  return player.ready ? (
                    <Banger>Waiting</Banger>
                  ) : (
                    <EnterCreds
                      {...player}
                      colors={gameState?.colorAvailability}
                    />
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
                  return <Banger>You dead</Banger>;
              }
            }}
          </PlayerCreator>
        )}
      </ClientDataChannel>
    </PlayerLayout>
  );
}

function EnterCreds({
  colors = {},
  ...props
}: ClientPlayer & { colors?: GameState["colorAvailability"] }) {
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
  return (
      <article
        style={{ textAlign: "center", maxWidth: "95%", margin: "auto 0" }}
      >
        <Input
          ref={inputRef}
          style={{ color: props.color, margin: "1em auto", maxWidth: "75%" }}
          value={hasDefaultName ? "" : props.name}
          onChange={onChangeInput}
          placeholder={hasDefaultName ? props.name : ""}
          maxLength={10}
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
          {Object.entries(colors).map(([color, available]) => {
            const isPlayerColor = color === props.color;
            return (
              <figure
                key={color}
                onClick={() => available && props.setColor(color)}
                style={{
                  boxSizing: "border-box",
                  width: 50,
                  height: 50,
                  margin: 15,
                  borderRadius: "50%",
                  background: color,
                  transform:
                    isPlayerColor || !available
                      ? `scale(${isPlayerColor ? 1.2 : 0.8})`
                      : undefined,
                  transition:
                    "transform 150ms ease-out, box-shadow 150ms ease-out, opacity 75ms ease-out",
                  opacity: isPlayerColor || available ? 1 : 0.2,
                  boxShadow: isPlayerColor
                    ? "inset 0 0 0 5px rgba(0,0,0,0.1)"
                    : "none"
                }}
              >
                <figcaption style={{ visibility: "hidden" }}>
                  {color}
                </figcaption>
              </figure>
            );
          })}
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
          <Button color={props.color} disabled={!props.name} onClick={() => props.setReady(true)}>
            Ready!
          </Button>
        </section>
      </article>
  );
}
