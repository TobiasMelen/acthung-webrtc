import createSnakeCanvas, { SnakeInput } from "./createSnakeCanvas";
import React, { useRef, useEffect, CSSProperties } from "react";

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
  width: "100%"
};
export default function GameRound({ run, input, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<ReturnType<typeof createSnakeCanvas>>();
  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }
    const snakeCanvas = createSnakeCanvas(containerRef.current, input);
    canvasRef.current = snakeCanvas;
    return () => snakeCanvas.destroy();
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
  }, [canvasRef.current, run])
  return <div ref={containerRef} style={canvascontainerStyle}>{children}</div>;
}
