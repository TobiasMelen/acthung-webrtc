import React, { useState } from "react";
import Game from "../../lobby/Game";
import useMockPlayers from "../useMockPlayers";

export const props = {
  numberOfPlayers: 4,
  playersReady: false
};

export default function GamePreview(properties: typeof props) {
  const players = useMockPlayers(properties);
  return <Game lobbyName="preview-game" players={players} />;
}
