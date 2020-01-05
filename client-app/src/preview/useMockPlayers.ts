import { LobbyPlayer } from "../lobby/Lobby";
import { useState, useEffect } from "react";
import { ALL_COLORS } from "../constants";
import useEffectWithDeps from "../useEffectWithDeps";

type Options = {
  numberOfPlayers?: number;
  playersReady?: boolean;
};

type MockPlayer = LobbyPlayer & { hidden: boolean };

export default function useMockPlayers({
  numberOfPlayers = ALL_COLORS.length,
  playersReady = true
}: Options) {
  const modifyPlayer = (id: string) => (
    fn: (player: MockPlayer) => MockPlayer
  ) =>
    setPlayers(players =>
      players.map(player => (player.id === id ? fn(player) : player))
    );
  const [players, setPlayers]: [
    MockPlayer[],
    React.Dispatch<React.SetStateAction<MockPlayer[]>>
  ] = useState(
    ALL_COLORS.sort(() => 0.5 - Math.random())
      .slice(0, numberOfPlayers)
      .map((color, index) => {
        const id = (index + 1).toString();
        const modifier = modifyPlayer(id);
        return {
          color,
          id,
          latency: 10,
          name: `Player ${id}`,
          onTurnInput: () => {},
          ready: playersReady,
          score: 0,
          setScore: score => modifier(player => ({ ...player, score })),
          setState: state => modifier(player => ({ ...player, state })),
          state: "joining",
          hidden: !playersReady
        } as MockPlayer;
      })
  );

  useEffectWithDeps(
    prevDeps => {
      const playerOne = players[0];
      if (playerOne == null || prevDeps?.[0]?.[0] != null) {
        return;
      }
      let keydown: any;
      let keyup: any;
      modifyPlayer("1")(player => ({
        ...player,
        onTurnInput: turn => {
          keydown = (ev: KeyboardEvent) =>
            ev.keyCode === 37 ? turn(-1) : ev.keyCode === 39 ? turn(1) : null;
          addEventListener("keydown", keydown);
          keyup = (ev: KeyboardEvent) =>
            ev.keyCode === 37 || ev.keyCode === 39 ? turn(0) : null;
          addEventListener("keyup", keyup);
        }
      }));
      return () => {
        window.removeEventListener("keydown", keydown);
        window.removeEventListener("keyup", keyup);
      };
    },
    [players] as const
  );

  useEffect(() => {
    if (players.every(player => !player.hidden)) {
      return;
    }
    const showPlayer = window.setTimeout(() => {
      let shownPlayer = false;
      setPlayers(players =>
        players.map(player => {
          if (!shownPlayer && player.hidden) {
            shownPlayer = true;
            return { ...player, hidden: false };
          }
          return player;
        })
      );
    }, 450);
    return () => {
      window.clearTimeout(showPlayer);
    };
  }, [players]);

  useEffect(() => {
    if (players.every(player => player.ready)) {
      return;
    }
    const readyPlayer = window.setTimeout(() => {
      let readiedPlayer = false;
      setPlayers(players =>
        players.map(player => {
          if (!readiedPlayer && !player.hidden && !player.ready) {
            readiedPlayer = true;
            return { ...player, ready: true };
          }
          return player;
        })
      );
    }, 460);
    return () => {
      window.clearTimeout(readyPlayer);
    };
  }, [players]);
  return players.filter(player => !player.hidden);
}
