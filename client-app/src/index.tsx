import ReactDOM from "react-dom";
import React, { useEffect } from "react";
import SnakeCanvas from "./SnakeCanvas";
import LobbyConnection from "./connection/LobbyDataChannels";
import { Router } from "@reach/router";
import Lobby from "./Lobby";
import Client from "./Client";

ReactDOM.render(
  <Router>
    <Lobby path="/lobby/:lobbyName" />
    <Client path="/:lobbyName" />
  </Router>,
  document.getElementById("app-root")
);
