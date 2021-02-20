import { ComponentProps, useMemo } from "react";
import React from "react";
import { DEFAULT_COLOR } from "../constants";

export type TriangleDirection = "up" | "down" | "left" | "right";

type Props = {
  strokeWidth?: number;
  direction: TriangleDirection;
} & ComponentProps<"svg">;

type Point = [number, number];

export default function Triangle({
  direction,
  fill,
  stroke = DEFAULT_COLOR,
  strokeWidth = 5,
  ...props
}: Props) {
  const points = useMemo(() => {
    const min = strokeWidth;
    const half = 50;
    const max = 100 - strokeWidth;
    const points = ((): [Point, Point, Point] => {
      switch (direction) {
        case "up":
          return [
            [half, min],
            [min, max],
            [max, max]
          ];
        case "down":
          return [
            [min, min],
            [max, min],
            [half, max]
          ];
        case "left":
          return [
            [min, half],
            [max, min],
            [max, max]
          ];
        case "right":
          return [
            [min, min],
            [min, max],
            [max, half]
          ];
        default:
          ((noValue: never) => {
            throw new Error(`Can't draw triangle in direction "${noValue}"`);
          })(direction);
      }
    })();
    return points.join(" ");
  }, [direction, strokeWidth]);
  return (
    <svg viewBox="0 0 100 100" style={{width: "100%", maxHeight: "100%", display: "block"}} {...props}>
      <polygon
        points={points}
        strokeWidth={strokeWidth}
        style={{
          fill,
          stroke,
          strokeLinejoin: "round",
          transition: "fill 150ms ease-out"
        }}
      />
    </svg>
  );
}
