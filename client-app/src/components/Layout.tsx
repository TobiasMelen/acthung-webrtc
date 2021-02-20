import React, {
  ComponentProps,
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMemoMerge } from "../hooks/useMemoMerge";
import useMediaMatch, { MediaQueryMatch } from "../hooks/useMediaMatch";

const createContainerStyle = (centered: boolean): CSSProperties => ({
  width: "100vw",
  height: "100%",
  display: "flex",
  justifyContent: centered ? "center" : "space-between",
  alignItems: "center",
  overflow: "hidden",
});

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

export default function PlayerLayout({
  centered = true,
  ...props
}: { centered?: boolean } & ComponentProps<"main">) {
  const containerMediaMatchStyle = useMediaMatch(containerMediaStyle);
  const containerStyle = useMemo(() => createContainerStyle(centered), [
    centered
  ]);
  return (
    <main
      {...props}
      style={useMemoMerge(
        [containerStyle, ...containerMediaMatchStyle, props.style],
        [createContainerStyle, containerMediaMatchStyle, props.style]
      )}
    />
  );
}
