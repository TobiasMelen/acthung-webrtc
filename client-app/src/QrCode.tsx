import Qr from "qrcode-svg";
import React, { useEffect, useState } from "react";
type Props = {
  style?: React.CSSProperties;
  children: string;
};

export default function QrCode({ children, style }: Props) {
  const [qrCode, setQrCode] = useState<string>("");
  useEffect(() => {
    //@ts-ignore: Wrong declaration
    const qrCode = new Qr({
      content: children,
      background: "none",
      color: "white",
      padding: 0,
      ecl: "L",
      container: "none",
    });
    setQrCode(qrCode.svg());
    return () => {
      setQrCode("");
    };
  }, [children]);
  return (
    <svg style={{display: "block", maxHeight:"100%", ...style}} viewBox="0 0 256 256"
      dangerouslySetInnerHTML={{ __html: qrCode }}
    ></svg>
  );
}
