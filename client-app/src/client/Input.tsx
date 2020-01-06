import { useMemoMerge } from "../useMemoMerge";
import React, { useMemo, CSSProperties, forwardRef } from "react";
import { DEFAULT_COLOR, DEFAULT_FONT_FAMILY } from "../constants";

const inputStyle = (color = DEFAULT_COLOR): CSSProperties => ({
  width: "100%",
  background: "none",
  fontSize: "2.8em",
  fontWeight: 900,
  display: "block",
  border: "none",
  borderBottom: `5px solid ${color}`,
  fontFamily: DEFAULT_FONT_FAMILY,
  borderRadius: 0,
  textAlign: "center",
  padding: "0.5em 0",
  textTransform: "uppercase",
  caretColor: color,
});

function Input(
  props: React.ComponentProps<"input">,
  ref: React.Ref<HTMLInputElement>
) {
  return (
    <input
      autoCapitalize="characters"
      type="text"
      ref={ref}
      {...props}
      style={useMemoMerge([
        useMemo(() => inputStyle(props.style?.color), [props.style?.color]),
        props.style
      ])}
    />
  );
}

export default forwardRef(Input);
