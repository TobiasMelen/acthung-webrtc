import { CSSProperties } from "react";
import React from "react";

type Props = {
  color: CSSProperties["color"];
  setTurn(turn: number): void;
};

export default function PlayerUI({ setTurn, color }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        height: "100%"
      }}
    >
      <div
        style={{
          height: "100%",
          width: "20%",
          background: "red",
          touchAction: "manipulation"
        }}
        onTouchStart={() => setTurn(-1)}
        onTouchEnd={() => setTurn(0)}
      ></div>
      <div
        style={{
          height: "100%",
          width: "20%",
          background: "green",
          touchAction: "manipulation"
        }}
        onTouchStart={() => setTurn(1)}
        onTouchEnd={() => setTurn(0)}
      ></div>
    </div>
  );
}
