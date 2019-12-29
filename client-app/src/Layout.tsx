import React, { CSSProperties, PropsWithChildren } from "react";
import { useMemoMerge } from "./useMemoMerge";

const mainHeadingStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: "2.5em",
  margin: 0
};

const subHeadingStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: "1.5em",
  margin: 0
};

export function MainHeading({ children }: PropsWithChildren<{}>) {
  return <h1 style={mainHeadingStyle}>{children}</h1>;
}

export function SubHeading({
  children,
  ...props
}: JSX.IntrinsicElements["h2"]) {
  return (
    <h2 {...props} style={useMemoMerge([subHeadingStyle, props.style])}>
      {children}
    </h2>
  );
}
