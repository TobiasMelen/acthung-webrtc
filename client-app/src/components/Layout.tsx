import React, { ComponentProps, CSSProperties, useMemo } from "react";
import { useMemoMerge } from "../hooks/useMemoMerge";
import useMediaMatch, { MediaQueryMatch } from "../hooks/useMediaMatch";

const createContainerStyle = (centered: boolean): CSSProperties => ({
  width: "100vw",
  display: "flex",
  justifyContent: centered ? "center" : "space-between",
  alignItems: "center",
  overflow: "hidden"
});

const containerMediaStyle: MediaQueryMatch<CSSProperties> = {
  "(orientation: landscape)": {
    flexDirection: "row",
    height: "100vh",
    margin: "0 auto"
  },
  "(orientation: portrait)": {
    flexDirection: "column",
    height: "90vh"
  }
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
