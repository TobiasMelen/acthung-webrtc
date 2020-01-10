import io from "socket.io-client";
import { useMemo, useEffect, useState } from "react";
import { SIGNALING_URL } from "../constants";

type ConnectionStatus = "connecting" | "connected" | "error";

export default function useSignalClient(opts?: SocketIOClient.ConnectOpts) {
  const client = useMemo(
    () =>
      io(SIGNALING_URL, {
        transports: ["websocket"],
        autoConnect: false,
        ...opts
      }),
    [opts]
  );
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  useEffect(() => {
    client.connect();
    client.on("connect", () => setStatus("connected"));
    client.on("error", (err: any) => setStatus("error"));
    return () => {
      client.disconnect();
      setStatus("connecting");
    };
  }, [client]);

  return [client, status] as const;
}
