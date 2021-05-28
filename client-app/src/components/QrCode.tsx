import QR from "../qr";
import React, { useEffect, useRef } from "react";
type Props = {
  style?: React.CSSProperties;
  colorScheme?: "onDarkBg" | "onWhiteBg";
  padding?: number;
  children: string;
};

export default function QrCode({ children, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    canvasRef.current &&
      children &&
      QR().writeToCanvas(children, canvasRef.current);
  }, [canvasRef.current, children]);
  return <canvas style={style} ref={canvasRef} />;
}
