import createSnakeCanvas, { SnakeInput } from "./createSnakeCanvas";
import React, { useRef, useEffect, CSSProperties } from "react";

type Props = {
  input: (SnakeInput & {
    onTurnInput(callBack: (turn: number) => void): void;
  })[];
};

const canvascontainerStyle: CSSProperties = {
  flexGrow: 1,
}
export default function SnakeCanvas({ input }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }
    const snakeCanvas = createSnakeCanvas(containerRef.current, input);
    snakeCanvas.snakeTurners.forEach((turner, index) =>
      input[index]?.onTurnInput(turner)
    );
    snakeCanvas.run();
    return () => snakeCanvas.stop();
  }, [containerRef.current]);
  return <div ref={containerRef} style={canvascontainerStyle} />;
}
