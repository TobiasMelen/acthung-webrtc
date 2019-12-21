import createSnakeCanvas, { SnakeInput } from "./createSnakeCanvas";
import React, { useRef, useEffect } from "react";

type Props = { input: SnakeInput[] };
export default function SnakeCanvas({ input }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }
    const snakeCanvas = createSnakeCanvas(containerRef.current, input);
    document.addEventListener("keydown", e => {
      console.log(e.key);
      switch (e.key) {
        case "a": {
          snakeCanvas.snakeTurners[0](-1);
          break;
        }
        case "s": {
          snakeCanvas.snakeTurners[0](1);
          break;
        }
      }
    });
    document.addEventListener("keyup", e => {
        console.log(e.key);
        switch (e.key) {
          case "a": {
            snakeCanvas.snakeTurners[0](1);
            break;
          }
          case "s": {
            snakeCanvas.snakeTurners[0](-1);
            break;
          }
        }
      });
    snakeCanvas.run();
    return () => snakeCanvas.stop();
  }, [containerRef.current]);
  return <div ref={containerRef} />;
}
