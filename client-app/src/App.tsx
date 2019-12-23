import React, { useMemo, useCallback, useState, useEffect } from "react";
import Lobby from "./Lobby";
import Client from "./Client";

const getHashValue = () => location.hash.startsWith("#") ? location.hash.substring(1) : location.hash;

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
      return <Lobby lobbyName={hash.substring("lobby/".length)} />;
    }
    if (location.hash.length > 0) {
      return <Client lobbyName={hash} />;
    }
    return <></>;
  }, [hashValue]);

  return <InnerComponent />;
}
