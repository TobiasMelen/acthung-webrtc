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
  alignItems: "start"
};

export default function Waiting({ url, players }: Props) {
  return (
    <Layout>
      <div style={{ width: "15%" }} />
      <div
        style={{
          width: "50%",
          maxHeight: "75%"
        }}
      >
        <QrCode
          colorScheme="onWhiteBg"
          padding={2}
          style={{
            maxWidth: 550,
            maxHeight: 550,
            margin: "0 auto"
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
            marginTop: "0.8em"
          }}
        >
          {url}
        </a>
      </div>
      <div
        style={{
          ...verticalFlex,
          width: "15%",
          flexGrow: players.length ? 1 : 0,
          transition: "flex-grow 250ms ease-out"
        }}
      >
        {players.map(player => (
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
        transition: "transform 150ms ease-out, opacity 150ms ease-out",
        transform: player.ready ? "scale(1.1) translateX(5%)" : undefined,
        animation: "fadeIn 250ms ease-out, fromRight 250ms ease-out",
        minWidth: "7em"
      }}
      key={player.id}
    >
      <h2
        style={{
          color: player.color,
          fontSize: "3em",
          transition: "color 150ms"
        }}
      >
        {player.name} {player.ready ? <small>👍</small> : "  "}
      </h2>
    </div>
  );
};
