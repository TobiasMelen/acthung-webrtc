import React, { useRef, useEffect, CSSProperties, useState } from "react";
import snakeGameContext from "../gameCanvas/snakeGameContext";
import { LobbyPlayer } from "../hooks/useStateForLobby";
import { wait } from "../utility";

type PlayerInfo = { name: string; color: string };

type RoundResult =
  | { type: "multiplayer"; roundWinner?: PlayerInfo; gameWinner?: PlayerInfo }
  | { type: "singleplayer"; score: number; name: string; color: string };

type Props = {
  players: LobbyPlayer[];
  isSinglePlayer: boolean;
  winningScore: number;
  onRoundEnd: (result: RoundResult) => void;
};

const canvasStyle: CSSProperties = {
  flexGrow: 1,
  height: "100%",
  width: "100%",
};

type Turners = Record<string, (turn: number) => void>;

type CanvasContext = Awaited<ReturnType<typeof createSnakeCanvas>>;

export default function GameRound({
  players,
  isSinglePlayer,
  winningScore,
  onRoundEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [turners, setTurners] = useState<Turners>({});

  // Bind turners to players - runs on mount and when players reconnect
  useEffect(() => {
    console.log("rebinding turners");
    for (const player of players) {
      const turner = turners[player.id];
      if (turner) {
        player.onTurnInput(turner);
      }
    }
  }, [players, turners]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || players.length === 0) return;

    // Local game state - avoids stale closure issues
    const alive = new Set(players.map((p) => p.id));
    const scores = new Map(
      players.map((p) => [p.id, isSinglePlayer ? 0 : p.score]),
    );
    const holePasses = new Map(players.map((p) => [p.id, 0]));
    let roundEnded = false;
    let ctx: CanvasContext | undefined;

    const syncScore = (id: string) => {
      const player = players.find((p) => p.id === id);
      player?.setScore(scores.get(id) ?? 0);
    };

    const handleHolePass = (id: string) => {
      const threshold = isSinglePlayer ? 1 : 4;
      const passes = (holePasses.get(id) ?? 0) + 1;
      if (passes >= threshold) {
        scores.set(id, (scores.get(id) ?? 0) + 1);
        holePasses.set(id, 0);
        syncScore(id);
        players.find((p) => p.id === id)?.resetHolePasses();
      } else {
        holePasses.set(id, passes);
        players.find((p) => p.id === id)?.addHolePass();
      }
    };

    const handleDeath = (id: string) => {
      if (roundEnded) return;

      const player = players.find((p) => p.id === id);
      player?.setState("dead");
      alive.delete(id);

      // Award points to survivors (multiplayer)
      if (!isSinglePlayer) {
        for (const aliveId of alive) {
          scores.set(aliveId, (scores.get(aliveId) ?? 0) + 1);
          syncScore(aliveId);
        }
      }

      const shouldEnd = isSinglePlayer ? alive.size === 0 : alive.size <= 1;
      if (shouldEnd) {
        roundEnded = true;
        ctx?.stop();
        setTimeout(() => {
          if (isSinglePlayer && player) {
            onRoundEnd({
              type: "singleplayer",
              score: scores.get(id) ?? 0,
              name: player.name,
              color: player.color,
            });
          } else {
            const winnerId = [...alive][0];
            const winner = players.find((p) => p.id === winnerId);
            const roundWinner = winner ?? { name: "Nobody", color: "inherit" };

            let maxScore = 0;
            let maxPlayer: LobbyPlayer | null = null;
            for (const p of players) {
              const s = scores.get(p.id) ?? 0;
              if (s > maxScore) {
                maxScore = s;
                maxPlayer = p;
              }
            }
            const gameWinner = maxScore >= winningScore ? maxPlayer : null;

            onRoundEnd({
              type: "multiplayer",
              roundWinner,
              gameWinner: gameWinner ?? undefined,
            });
          }
        }, 1000);
      }
    };

    createSnakeCanvas(canvasEl).then((canvas) => {
      ctx = canvas;

      const turners = players.reduce((turners, player) => {
        player.setState("playing");
        player.resetHolePasses();
        if (isSinglePlayer) player.setScore(0);

        const turner = canvas.inputSnakeData({
          id: player.id,
          color: player.color,
          onCollision: () => handleDeath(player.id),
          onHolePass: () => handleHolePass(player.id),
        });
        turners[player.id] = turner;
        return turners;
      }, {} as Turners);

      setTurners(turners);

      wait(100).then(() => canvas.run());
    });

    return () => {
      ctx?.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} style={canvasStyle} />;
}

async function createSnakeCanvas(
  canvas: HTMLCanvasElement,
  {
    maxVerticalResolution = 1080,
    ...contextOptions
  }: { maxVerticalResolution?: number } & Parameters<
    typeof snakeGameContext
  >[1] = {},
) {
  canvas.style.height = "100%";
  canvas.style.width = "100%";
  if (canvas.clientHeight > maxVerticalResolution) {
    canvas.height = maxVerticalResolution;
    canvas.width =
      (maxVerticalResolution / canvas.clientHeight) * canvas.clientWidth;
  } else {
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;
  }

  const gameContext = await (
    "OffscreenCanvas" in window && false
      ? (await import("../gameCanvas/offscreenGame")).default
      : snakeGameContext
  )(canvas, contextOptions);

  return gameContext;
}
