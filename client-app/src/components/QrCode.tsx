import Qr from "qrcode-svg";
import React, { useEffect, useState } from "react";
import { inlineThrow } from "../utility";
type Props = {
  style?: React.CSSProperties;
  colorScheme?: "onDarkBg" | "onWhiteBg";
  padding?: number;
  children: string;
};

export default function QrCode({
  colorScheme = "onDarkBg",
  padding = 0,
  children,
  style
}: Props) {
  const [qrCode, setQrCode] = useState<string>("");
  useEffect(() => {
    const [color, background] = (() => {
      switch (colorScheme) {
        case "onDarkBg": {
          return ["white", "none"];
        }
        case "onWhiteBg": {
          return ["black", "white"];
        }
        default: {
          return ((scheme: never) =>
            inlineThrow(`No colors for colorscheme ${colorScheme}`))(
            colorScheme
          );
        }
      }
    })();
    //@ts-ignore: Wrong declaration
    const qrCode = new Qr({
      content: children,
      background,
      color,
      padding,
      ecl: "L",
      container: "none",
      join: true
    });
    setQrCode(qrCode.svg());
    return () => {
      setQrCode("");
    };
  }, [children]);
  return (
    <svg
      style={{ display: "block", position: "relative", ...style }}
      viewBox="0 0 256 256"
      preserveAspectRatio="xMidYMax slice"
      dangerouslySetInnerHTML={{ __html: qrCode }}
    ></svg>
  );
}
