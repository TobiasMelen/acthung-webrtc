import React, { ComponentProps, CSSProperties } from "react";
import { useMemoMerge } from "../useMemoMerge";
import useMediaMatch, { MediaQueryMatch } from "../useMediaMatch";

const containerStyle: CSSProperties = {
  width: "100vw",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

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

export default function PlayerLayout(props: ComponentProps<"main">) {
  const containerMediaMatchStyle = useMediaMatch(containerMediaStyle);
  return (
    <main
      {...props}
      style={useMemoMerge(
        [containerStyle, ...containerMediaMatchStyle, props.style],
        [containerStyle, containerMediaMatchStyle, props.style]
      )}
    />
  );
}
