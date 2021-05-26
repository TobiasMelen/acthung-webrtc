import { useRef, useState, useEffect, useMemo } from "react";

export default function useJsonWebsocket(url?: string, reconnectAttempts = 5) {
  const [retries, setRetries] = useState(0);
  const failedAllRetries = retries > reconnectAttempts;
  const [socket, setSocket] = useState<WebSocket>();
  //Clear socket on url changes
  useEffect(() => {
    setSocket((socket) => {
      if (socket) {
        socket.onclose = null;
        socket?.close();
      }
      return undefined;
    });
    setRetries(0);
  }, [url]);
  useEffect(() => {
    if (!url || socket != null || failedAllRetries) {
      return;
    }
    const s = new WebSocket(url);
    let retryTimeout: number;
    s.onclose = () => {
      retryTimeout = window.setTimeout(() => {
        setRetries((r) => r + 1);
        setSocket(undefined);
      }, 1000);
    };
    s.onopen = () => {
      setSocket(s);
      setRetries(0);
    };
    s.onerror = () => s.close();
    return () => {
      window.clearTimeout(retryTimeout);
    };
  }, [url, retries, socket]);
  const jsonSocket = useMemo(
    () =>
      socket
        ? {
            addListener(listener: (data: any) => void) {
              const fn = ({ data }: MessageEvent<any>) =>
                listener(JSON.parse(data));
              socket.addEventListener("message", fn);
              return () => socket.removeEventListener("message", fn);
            },
            send(data: any) {
              socket.send(JSON.stringify(data));
            },
          }
        : null,
    [socket]
  );
  return jsonSocket == null
    ? {
        status: failedAllRetries
          ? ("failed" as const)
          : ("connecting" as const),
      }
    : { status: "connected" as const, ...jsonSocket };
}
