import { QRCode as Qr } from "react-qr-svg";
import React from "react";
type Props = {
  style?: React.CSSProperties;
  colorScheme?: "onDarkBg" | "onWhiteBg";
  padding?: number;
  children: string;
};

export default function QrCode({
  children,
  style,
}: Props) {
  return (
    <Qr
      value={children}
      bgColor="white"
      fgColor="black"
      style={{
        backgroundColor: "white",
        display: "block",
        position: "relative",
        ...style,
      }}
      preserveAspectRatio="xMidYMax slice"
    />
  );
}
