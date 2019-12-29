import React, {
  ComponentProps,
  Ref,
  CSSProperties,
  useMemo,
  forwardRef
} from "react";
import { useMemoMerge } from "./useMemoMerge";
import { DEFAULT_COLOR, DEFAULT_FONT_FAMILY } from "./constants";

const buttonStyle = (color: string): CSSProperties => ({
  border: `5px solid ${color}`,
  color,
  borderRadius: "1.5em",
  padding: "0.5em 1.5em",
  fontWeight: 900,
  fontSize: "1.5em",
  fontFamily: DEFAULT_FONT_FAMILY
});

function Button(
  { color = DEFAULT_COLOR, ...props }: ComponentProps<"button">,
  ref: Ref<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      {...props}
      style={useMemoMerge([
        useMemo(() => buttonStyle(color), [color]),
        props.style
      ])}
    >
      {props.children}
    </button>
  );
}

export default forwardRef(Button);
