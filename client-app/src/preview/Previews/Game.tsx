import React, { useState } from "react";
import useMockPlayers from "../useMockPlayers";
import { Game } from "../../components/Lobby";

export const props = {
  numberOfPlayers: 4,
  playersReady: false
};

export default function GamePreview(properties: typeof props) {
  const players = useMockPlayers(properties);
  return <Game lobbyName="preview-game" players={players} />;
}
