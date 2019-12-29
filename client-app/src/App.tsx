import React, { useCallback, useState, useEffect } from "react";
import Game from "./lobby/Game";
import Client from "./client/Client";
import LobbyConnection from "./connection/LobbyConnection";
import Lobby from "./lobby/Lobby";

const getHashValue = () =>
  location.hash.startsWith("#") ? location.hash.substring(1) : location.hash;

export default function App() {
  //Simple hash routing since we're hosting on GH pages that can't consolidate paths to index.html
  const [hashValue, setHashValue] = useState(getHashValue());
  useEffect(() => {
    const hashListener = (e: HashChangeEvent) => setHashValue(getHashValue());
    addEventListener("hashchange", hashListener);
    return () => removeEventListener("hashchange", hashListener);
  }, [setHashValue]);

  const InnerComponent = useCallback(() => {
    const hash = hashValue;
    if (hash.startsWith("lobby/")) {
      const lobbyName = hash.substring("lobby/".length);
      return (
        <LobbyConnection lobbyName={lobbyName}>
          {connections => (
            <Lobby clientConnections={connections}>
              {players => <Game players={players} lobbyName={lobbyName} />}
            </Lobby>
          )}
        </LobbyConnection>
      );
    }
    if (location.hash.length > 0) {
      return <Client lobbyName={hash} />;
    }
    return <></>;
  }, [hashValue]);

  return <InnerComponent />;
}
