import ReactDOM from "react-dom";
import React, { useEffect } from "react";
import SnakeCanvas from "./SnakeCanvas";
import LobbyConnection from "./LobbyConnection";

ReactDOM.render(
  <>
    <LobbyConnection lobbyName="test" />
    <SnakeCanvas
      input={[
        {
          color: "#f00",
          onCollision() {
            console.log("collided!");
          }
        }
      ]}
    />
  </>,
  document.getElementById("app-root")
);
