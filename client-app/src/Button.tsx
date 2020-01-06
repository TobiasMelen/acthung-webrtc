import React, {
  ComponentProps,
  Ref,
  CSSProperties,
  useMemo,
  forwardRef
} from "react";
import { useMemoMerge } from "./useMemoMerge";
import { DEFAULT_COLOR, DEFAULT_FONT_FAMILY } from "./constants";

const buttonStyle = (color: string, disabled?: boolean): CSSProperties => ({
  border: `5px solid ${color}`,
  color,
  borderRadius: "1.5em",
  padding: "0.5em 1.5em",
  fontWeight: 900,
  fontSize: "1.5em",
  fontFamily: DEFAULT_FONT_FAMILY,
  opacity: disabled ? 0.3 : 1,
  background: "none",
  transition: "color 175ms ease-out, border-color 175ms ease-out"
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
        useMemo(() => buttonStyle(color, props.disabled), [
          color,
          props.disabled
        ]),
        props.style
      ])}
    >
      {props.children}
    </button>
  );
}

export default forwardRef(Button);
