import React, { PropsWithChildren, CSSProperties } from "react";

const containerStyle: CSSProperties = {
  height: "100vh",
  width: "100%",
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center"
};

export default function LobbyLayout({ children }: PropsWithChildren<{}>) {
  return <main style={containerStyle}>{children}</main>;
}

const contentStyle: CSSProperties = {
  textAlign: "center",
  margin: "2em 0"
};

export function LobbyContent({
  children,
  ...props
}: PropsWithChildren<React.ComponentProps<"article">>) {
  return (
    <article {...props} style={contentStyle}>
      {children}
    </article>
  );
}
