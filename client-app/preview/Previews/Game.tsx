import React, { useState } from "react";
import useMockPlayers from "../useMockPlayers";
import { Game } from "../../src/components/Lobby";

export const props = {
  numberOfPlayers: 7,
  playersReady: true
};

export default function GamePreview(properties: typeof props) {
  const players = useMockPlayers(properties);
  return <Game lobbyName="preview-game" players={players} allowSinglePlayer={false} />;
}
