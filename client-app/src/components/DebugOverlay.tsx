import React, { CSSProperties, useEffect, useState } from "react";
import debugLog, { subscribeDebugLog } from "../debugLog";
import webRtcSelfTest from "../webRtcSelfTest";

const overlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  bottom: 0,
  zIndex: 1000,
  maxWidth: "60vw",
  padding: "0.5em",
  background: "rgba(0,0,0,0.7)",
  color: "lime",
  font: "12px monospace",
  textTransform: "none",
  letterSpacing: 0,
  whiteSpace: "pre-wrap",
  pointerEvents: "none",
};

export default function DebugOverlay() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const onError = (event: ErrorEvent) =>
      debugLog("error:", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) =>
      debugLog("rejection:", event.reason);
    addEventListener("error", onError);
    addEventListener("unhandledrejection", onRejection);
    debugLog(navigator.userAgent);
    window.RTCPeerConnection && webRtcSelfTest();
    const unsubscribe = subscribeDebugLog(setLines);
    return () => {
      removeEventListener("error", onError);
      removeEventListener("unhandledrejection", onRejection);
      unsubscribe();
    };
  }, []);
  return <div style={overlayStyle}>{lines.join("\n")}</div>;
}
