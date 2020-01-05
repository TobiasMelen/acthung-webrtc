import { useEffect, useState, useMemo } from "react";
import React from "react";

export default function FlexGrowItem(props: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      style={{ ...props.style, flexGrow: .0001, animation: "flexGrow 1000ms ease-out forwards" }}
    />
  );
}
