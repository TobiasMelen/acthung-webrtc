import React, { CSSProperties, useEffect, useState } from "react";
import Layout from "./Layout";
import QrCode from "./QrCode";

type Props = {
  url: string;
  players: { id: string; name: string; color: string; ready: boolean }[];
};

const verticalFlex: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "start",
};

export default function Waiting({ url, players }: Props) {
  return (
    <Layout style={{ justifyContent: "space-around" }}>
      <div />
      <div
        style={{
          width: "40%",
        }}
      >
        <QrCode
          colorScheme="onWhiteBg"
          padding={2}
          style={{
            width: "100%",
            margin: "0 auto 2em auto",
          }}
        >
          {url}
        </QrCode>
        <a
          href={url}
          style={{
            textAlign: "center",
            display: "block",
            fontSize: "0.8em",
            marginTop: "0.8em",
            alignSelf: "center",
          }}
        >
          {url}
        </a>
      </div>
      <div
        style={{
          ...verticalFlex,
          width: 0,
          flexGrow: players.length ? 0.5 : 0,
          transition: "flex-grow 500ms ease-in",
        }}
      >
        {players.map((player) => (
          <PlayerItem key={player.id} {...player} />
        ))}
      </div>
    </Layout>
  );
}

const PlayerItem = (player: Props["players"][0]) => {
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    window.setTimeout(() => setRendered(true), 100);
  }, []);
  return (
    <div
      style={{
        opacity: rendered ? 1 : 0,
        margin: "1.2em 0",
        transition: "transform 150ms ease-in, opacity 150ms ease-in",
        transform: player.ready ? "scale(1.1) translateX(5%)" : undefined,
        animation: "fadeIn 250ms ease-in, fromRight 500ms ease-in",
        minWidth: "7em",
      }}
      key={player.id}
    >
      <h2
        style={{
          color: player.color,
          fontSize: "3em",
          transition: "color 150ms",
          whiteSpace: "nowrap",
        }}
      >
        {player.name} {player.ready ? <small>👍</small> : "  "}
      </h2>
    </div>
  );
};
