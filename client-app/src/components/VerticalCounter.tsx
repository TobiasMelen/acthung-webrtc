import { relative } from "path";
import useDelayedValue from "../hooks/useDelayedValue";
import React from "react";

export default function VerticalCounter({number, duration = 150}: {
  number: number;
  duration?: number;
}) {
  const prevNumber = useDelayedValue(number, duration);
  const difference = prevNumber - number;
  return (
    <div style={{ position: "relative", display: "inline-flex", justifyContent: "flex-end" }}>
      <span
        key={number + prevNumber}
        style={{
          display: "inline-block",
          animationName:
            difference === 0
              ? ""
              : `fadeIn, ${difference ? "fromTop" : "fromBottom"}`,
          animationDuration: `${duration}ms`,
          animationFillMode: "both",
          animationDirection: "normal",
          animationTimingFunction: "linear",
        }}
      >
        {number}
      </span>
      {difference !== 0 && (
        <span
          key={prevNumber}
          style={{
            position: "absolute",
            inset: 0,
            animationDuration: `${duration}ms`,
            animationDirection: "reverse",
            animationName: `fadeIn, ${difference ? "fromBottom" : "fromTop"}`,
            animationFillMode: "both",
            animationTimingFunction: "linear",
          }}
        >
          {prevNumber}
        </span>
      )}
    </div>
  );
}
