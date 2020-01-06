import Game from "./Game";
import LobbyLayout, { LobbyContent } from "./LobbyLayout";
import { MainHeading, SubHeading } from "../Layout";
import QrCode from "../QrCode";
import React, { CSSProperties, useState, useEffect } from "react";
import FlexGrowItem from "../FlexGrowItem";

type Props = {
  url: string;
  players: { id: string; name: string; color: string; ready: boolean }[];
};

const verticalFlex: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
};

export default function Waiting({ url, players }: Props) {
  return (
    <LobbyLayout>
      <div
        style={{
          width: "50%",
          maxHeight: "75%"
        }}
      >
        <QrCode>{url}</QrCode>
        <a
          href={url}
          style={{
            textAlign: "center",
            display: "block",
            fontSize: "1.2em",
            marginTop: "0.8em"
          }}
        >
          {url}
        </a>
      </div>
      {players.length ? (
        <div style={{ ...verticalFlex, marginLeft: "3.5em", minWidth: "25%" }}>
          {players.map(player => (
            <PlayerItem key={player.id} {...player} />
          ))}
        </div>
      ) : null}
    </LobbyLayout>
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
      <SubHeading style={{ color: player.color, fontSize: "2em" }}>
        {player.name} {player.ready ? "✓" : "  "}
      </SubHeading>
    </div>
  );
};
