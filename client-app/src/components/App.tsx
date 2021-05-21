import React, { useEffect, useState } from "react";
import Banger from "./Banger";
import Player from "./Player";
import Lobby from "./Lobby";

const getHashValue = () =>
  location.hash.startsWith("#") ? location.hash.substring(1) : location.hash;

export default function App() {
  //Simple hash routing since we're hosting on GH pages that can't reroute sub paths to index.html
  const [hash, setHash] = useState(getHashValue());
  useEffect(() => {
    const hashListener = () => setHash(getHashValue());
    addEventListener("hashchange", hashListener);
    return () => removeEventListener("hashchange", hashListener);
  }, [setHash]);

  if (!window.RTCPeerConnection) {
    return (
      <Banger>
        <span style={{ color: "red" }}>Sorry!</span>
        <br />
        Your browser must support {" "}
        <a href="https://caniuse.com/?search=webrtc">WebRTC</a>
      </Banger>
    );
  }

  if (hash.startsWith("lobby/")) {
    const lobbyName = hash.substring("lobby/".length);
    return <Lobby lobbyName={lobbyName} />;
  }
  if (location.hash.length > 0) {
    return <Player lobbyName={hash} />;
  }
  return (
    <Banger>
      New{" "}
      <a href={`#lobby/${Math.random().toString(36).substring(8)}`}>Lobby</a>
    </Banger>
  );
}
