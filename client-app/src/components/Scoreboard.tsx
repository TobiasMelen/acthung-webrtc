import React from "react";
import { ALL_COLORS } from "../constants";
import { LobbyPlayer } from "../hooks/useStateForLobby";
import QrCode from "./QrCode";
import VerticalCounter from "./VerticalCounter";

export default function Scoreboard({
  players,
  url,
}: {
  players: LobbyPlayer[];
  url: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: -1,
        right: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              color: player.color,
              textAlign: "right",
              margin: "0 1.5em",
              paddingBottom: "2em",
            }}
          >
            <div
              style={{
                fontSize: "5.2em",
                display: "flex",
                gap: "0.225em",
                justifyContent: "flex-end",
                alignItems: "stretch",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column-reverse",
                  gap: "0.075em",
                  padding: "0.175em 0",
                  justifyContent: "flex-start",
                }}
              >
                {new Array(player.holePasses || 0).fill(
                  <div
                    style={{
                      borderRadius: "100%",
                      backgroundColor: player.color,
                      padding: "0.075em",
                      animation: 'growIn 500ms both cubic-bezier(0,0,0,2)'
                    }}
                  />,
                )}
              </div>
              <VerticalCounter number={player.score} />
            </div>
            <div style={{ fontSize: "1.2em", whiteSpace: "nowrap" }}>
              {player.name}
            </div>
          </div>
        ))}
      </div>
      {ALL_COLORS.length > players.length && (
        <QrCode
          colorScheme="onWhiteBg"
          padding={2}
          style={{
            width: 150,
            height: 150,
            margin: "2em",
          }}
        >
          {url}
        </QrCode>
      )}
    </div>
  );
}
