import React, {
  ComponentProps,
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMemoMerge } from "../hooks/useMemoMerge";
import useMediaMatch, { MediaQueryMatch } from "../hooks/useMediaMatch";

const containerStyle: CSSProperties = {
  width: "100vw",
  height: "100%",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  overflow: "hidden",
};

const containerMediaStyle: MediaQueryMatch<CSSProperties> = {
  "(orientation: landscape)": {
    flexDirection: "row",
    margin: "0 auto",
    overflow: "visible",
  },
  "(orientation: portrait)": {
    flexDirection: "column",
  },
};

export default function PlayerLayout(props: ComponentProps<"main">) {
  const containerMediaMatchStyle = useMediaMatch(containerMediaStyle);
  return (
    <main
      {...props}
      style={useMemoMerge(
        [containerStyle, ...containerMediaMatchStyle, props.style],
        [containerMediaMatchStyle, props.style]
      )}
    />
  );
}
