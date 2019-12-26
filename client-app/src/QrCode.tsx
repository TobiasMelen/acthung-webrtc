import Qr from "qrcode-svg";
import React, { useEffect, useState } from "react";
type Props = {
  children: string;
};

export default function QrCode({ children }: Props) {
  const [qrCode, setQrCode] = useState<string>("");
  useEffect(() => {
    const qrCode = new Qr({
      content: children,
      background: "none",
      color: "white",
      padding: 0,
      height: 400,
      width: 400,
      ecl: "L"
    });
    setQrCode(qrCode.svg());
    return () => {
      setQrCode("");
    };
  }, [children]);
  return (
    <div
      style={{ margin: "3em 0" }}
      dangerouslySetInnerHTML={{ __html: qrCode }}
    ></div>
  );
}
