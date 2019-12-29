import { Connection, Ping } from "../connection/commonConnections";
import { useRef, useState, useEffect } from "react";

//This is messed up, but by keeping sending ping packages over the channel, latency is keeped consistent and low.
//If nothing is sent for a couple of deciseconds, latency will start to vary wildly.
//This might have to do with my router (known to be shitty in the past)
export default function usePingLatency(
  connection?: Connection<Ping, Ping>,
  pingIntervalMs = 100,
  reportPingNumber = 20
) {
  const pingInterval = useRef<number>();
  const pings = useRef<number[]>([]);
  const [latency, setLatency] = useState(0);
  useEffect(() => {
    if (connection == null) {
      return;
    }
    pingInterval.current = window.setInterval(() => {
      connection.send({ type: "ping", data: { timeStamp: performance.now() } });
    }, pingIntervalMs);
    connection.on("ping", ({ timeStamp }) => {
      pings.current.push(performance.now() - timeStamp);
      if (pings.current.length >= reportPingNumber) {
        setLatency(
          Math.round(pings.current.reduce((acc, ping) => acc + ping, 0) /
            pings.current.length
        ));
        pings.current = [];
      }
    });
    return () => {
      window.clearInterval(pingInterval.current);
      pings.current = [];
      setLatency(0);
    };
  }, [connection, pingIntervalMs, reportPingNumber]);
  return latency;
}
