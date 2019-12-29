import createSnakeCanvas, { SnakeInput } from "./createSnakeCanvas";
import React, { useRef, useEffect, CSSProperties } from "react";

type Props = {
  input: (SnakeInput & {
    onTurnInput(callBack: (turn: number) => void): void;
  })[];
};

const canvascontainerStyle: CSSProperties = {
  flexGrow: 1
};
export default function SnakeCanvas({ input }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<ReturnType<typeof createSnakeCanvas>>();
  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }
    const snakeCanvas = createSnakeCanvas(containerRef.current, input);
    snakeCanvas.run();
    canvasRef.current = snakeCanvas;
    return () => snakeCanvas.destroy();
  }, [containerRef.current]);
  useEffect(() => {
    const snakeCanvas = canvasRef.current;
    if (snakeCanvas != null) {
      snakeCanvas.snakeTurners.forEach((turner, index) =>
        input[index]?.onTurnInput(turner)
      );
    }
  }, [canvasRef.current, input]);
  return <div ref={containerRef} style={canvascontainerStyle} />;
}
