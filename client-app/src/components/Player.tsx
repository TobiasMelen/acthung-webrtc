import React, { useState, useCallback, useRef } from "react";
import PlayerControls from "./PlayerControls";
import PlayerLayout from "./Layout";
import Input from "./Input";
import Button from "./Button";
import Banger from "./Banger";
import useConnectionForPlayer from "../hooks/useConnectionForPlayer";
import useStateForPlayer from "../hooks/useStateForPlayer";

type Props = {
  lobbyName: string;
};

type ClientPlayer = ReturnType<typeof useStateForPlayer>[0];

export default function Client({ lobbyName = "new" }: Props) {
  const channel = useConnectionForPlayer({ lobbyName });
  const [player, gameState] = useStateForPlayer(channel);
  const renderCore = useCallback(() => {
    if (player == null) {
      return <Banger>Connecting</Banger>;
    }
    switch (player.state) {
      case "joining":
        return player.ready ? (
          <Banger>Waiting</Banger>
        ) : (
          <EnterCreds {...player} colors={gameState?.colorAvailability} />
        );
      case "playing":
        return (
          <PlayerControls
            setTurn={player.setTurn}
            color={player.color}
            latency={player.latency}
          />
        );
      case "dead":
        return <Banger>You dead</Banger>;
    }
  }, [player, gameState]);
  return (
    <PlayerLayout>
      <Latency latency={player?.latency} />
      {renderCore()}
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
    <article style={{ textAlign: "center", maxWidth: "95%", margin: "auto 0" }}>
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
              <figcaption style={{ visibility: "hidden" }}>{color}</figcaption>
            </figure>
          );
        })}
      </section>
      <section style={{ marginTop: "1.5em" }}>
        <Button
          color={props.color}
          disabled={!props.name}
          onClick={() => props.setReady(true)}
        >
          Ready!
        </Button>
      </section>
    </article>
  );
}

const Latency = ({ latency }: { latency?: number }) =>
  latency ? (
    <span
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        WebkitUserSelect: "none"
      }}
    >
      {latency} ms
    </span>
  ) : null;
