import React, { useRef, useEffect, CSSProperties } from "react";
import snakeGameContext, { SnakeInput } from "../canvas/snakeGameContext";

type Props = {
  run: boolean;
  input: (SnakeInput & {
    onTurnInput(callBack: (turn: number) => void): void;
  })[];
  children?: React.ReactNode;
};

const canvascontainerStyle: CSSProperties = {
  flexGrow: 1,
  height: "100%",
  width: "100%",
};
export default function GameRound({ run, input, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<
    PromiseResult<ReturnType<typeof createSnakeCanvas>>
  >();

  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }
    createSnakeCanvas(containerRef.current).then((canvas) => {
      canvasRef.current = canvas;
    });
    return () => canvasRef.current?.destroy();
  }, [containerRef.current]);

  useEffect(() => {
    const snakeCanvas = canvasRef.current;
    if (snakeCanvas == null) {
      return;
    }
    for (const snakeInput of input) {
      const turner = snakeCanvas.inputSnakeData(snakeInput);
      snakeInput.onTurnInput(turner);
    }
  }, [canvasRef.current, input]);

  useEffect(() => {
    const snakeCanvas = canvasRef.current;
    if (snakeCanvas == null) {
      return;
    }
    run ? snakeCanvas.run() : snakeCanvas.stop();
  }, [canvasRef.current, run]);

  return (
    <div ref={containerRef} style={canvascontainerStyle}>
      {children}
    </div>
  );
}

async function createSnakeCanvas(
  container: HTMLElement,
  {
    maxVerticalResolution = 1080,
    ...contextOptions
  }: { maxVerticalResolution?: number } & Parameters<
    typeof snakeGameContext
  >[1] = {}
) {
  //Create scaled canvas for rendering
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  canvas.style.height = "100%";
  canvas.style.width = "100%";
  if (container.clientHeight > maxVerticalResolution) {
    canvas.height = maxVerticalResolution;
    canvas.width =
      (maxVerticalResolution / container.clientHeight) * container.clientWidth;
  } else {
    canvas.height = container.clientHeight;
    canvas.width = container.clientWidth;
  }

  //If possibly to create gamecontext offscreen, in seperate web-worker, do so. Otherwise initialize it directly.
  const gameContext = await ("OffscreenCanvas" in window
    ? //Load offscreen script lazily to delay worker instantion until necessary
      (await import("../canvas/offscreenGame")).default
    : snakeGameContext)(canvas, contextOptions);

  return {
    ...gameContext,
    destroy() {
      gameContext.destroy();
      container.removeChild(canvas);
    },
  };
}
