import React, { useRef, useEffect, CSSProperties, useState } from "react";
import snakeGameContext, { SnakeInput } from "../gameCanvas/snakeGameContext";

type Props = {
  run: boolean;
  input: (SnakeInput & {
    onTurnInput(callBack: (turn: number) => void): void;
  })[];
  children?: React.ReactNode;
};

const canvasStyle: CSSProperties = {
  flexGrow: 1,
  height: "100%",
  width: "100%",
};
export default function GameRound({ run, input, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<
    PromiseResult<ReturnType<typeof createSnakeCanvas>>
  >();

  useEffect(() => {
    if (canvasRef.current == null || canvas) {
      return () =>
        setCanvas((canvas) => {
          canvas?.destroy();
          return undefined;
        });
    }
    createSnakeCanvas(canvasRef.current).then((canvas) => {
      setCanvas(canvas);
    });
  }, [canvasRef.current]);

  useEffect(() => {
    if (canvas == null) {
      return;
    }
    for (const snakeInput of input) {
      const turner = canvas.inputSnakeData(snakeInput);
      snakeInput.onTurnInput(turner);
    }
  }, [canvas, input]);

  useEffect(() => {
    if (canvas == null) {
      return;
    }
    run ? canvas.run() : canvas.stop();
  }, [canvas, run]);

  return <canvas ref={canvasRef} style={canvasStyle} />;
}

async function createSnakeCanvas(
  canvas: HTMLCanvasElement,
  {
    maxVerticalResolution = 1080,
    ...contextOptions
  }: { maxVerticalResolution?: number } & Parameters<
    typeof snakeGameContext
  >[1] = {}
) {
  //Create scaled canvas for rendering
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

  //If possibly to create gamecontext offscreen, in seperate web-worker, do so. Otherwise initialize it directly.
  const gameContext = await ("OffscreenCanvas" in window && false
    ? //Load offscreen script lazily to delay worker instantion until necessary
      (await import("../gameCanvas/offscreenGame")).default
    : snakeGameContext)(canvas, contextOptions);

  return {
    ...gameContext,
    destroy() {
      gameContext.destroy();
    },
  };
}
