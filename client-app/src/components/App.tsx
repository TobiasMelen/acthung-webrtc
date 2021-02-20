import React, { useCallback, useEffect, useState } from "react";
import Banger from "./Banger";
import Player from "./Player";
import Lobby from "./Lobby";

const getHashValue = () =>
  location.hash.startsWith("#") ? location.hash.substring(1) : location.hash;

export default function App() {
  //Simple hash routing since we're hosting on GH pages that can't consolidate paths to index.html
  const [hashValue, setHashValue] = useState(getHashValue());
  useEffect(() => {
    const hashListener = () => setHashValue(getHashValue());
    addEventListener("hashchange", hashListener);
    return () => removeEventListener("hashchange", hashListener);
  }, [setHashValue]);

  const renderInner = useCallback(() => {
    const hash = hashValue;
    if (hash.startsWith("lobby/")) {
      const lobbyName = hash.substring("lobby/".length);
      return <Lobby lobbyName={lobbyName} />;
    }
    if (location.hash.length > 0) {
      return <Player lobbyName={hash} />;
    }
    return (
      <Banger startingEm={10}>
        New{" "}
        <a href={`#lobby/${Math.random().toString(36).substring(8)}`}>Lobby</a>
      </Banger>
    );
  }, [hashValue]);

  return renderInner();
}
