import React, { CSSProperties, PropsWithChildren } from "react";

const mainHeadingStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: "3em",
  margin: 0
};

const subHeadingStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: "2.5em",
  margin: 0
};

export function MainHeading({ children }: PropsWithChildren<{}>) {
  return <h1 style={mainHeadingStyle}>{children}</h1>;
}

export function SubHeading({ children }: PropsWithChildren<{}>) {
  return <h2 style={subHeadingStyle}>{children}</h2>;
}