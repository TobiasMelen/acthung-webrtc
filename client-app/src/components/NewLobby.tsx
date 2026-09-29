import React, { useState } from "react";
import Banger from "./Banger";
import Button from "./Button";
import ChromecastButton from "./ChromecastButton";
import useChromecast from "../hooks/useChromecast";

const createLobbyName = () => Math.random().toString(36).substring(8);

const lobbyUrl = (lobbyName: string) =>
  `${window.location.protocol}//${window.location.host}${window.location.pathname}#lobby/${lobbyName}`;

export default function NewLobby() {
  const chromecast = useChromecast();
  const [lobbyName] = useState(createLobbyName);
  const [isOnTv, setIsOnTv] = useState(false);

  if (isOnTv) {
    return (
      <Banger>
        Lobby is on your <span style={{ color: "yellow" }}>TV</span>
        <br />
        <Button
          style={{ fontSize: "0.2em", marginTop: "1em" }}
          onClick={() => {
            chromecast.stopCasting();
            setIsOnTv(false);
          }}
        >
          Stop casting
        </Button>
      </Banger>
    );
  }

  //Keyed so Banger re-fits its text when the cast button appears.
  return (
    <Banger key={chromecast.isAvailable ? "cast" : "local"}>
      New <a href={`#lobby/${lobbyName}`}>Lobby</a>
      {chromecast.isAvailable && (
        <>
          <br />
          <ChromecastButton
            isConnected={chromecast.isConnected}
            onCast={async () =>
              setIsOnTv(await chromecast.castUrl(lobbyUrl(createLobbyName())))
            }
            style={{ fontSize: "0.25em" }}
          />
        </>
      )}
    </Banger>
  );
}
