import { useRef, useState, useEffect } from "react";
import { MessageChannel, Converter } from "../messaging/setupMessageChannel";

//This is messed up, but by keeping sending ping packages over the channel, latency is keeped consistent and low.
//If nothing is sent for a couple of deciseconds, latency will start to vary wildly.
//This might have to do with my router (known to be shitty in the past)
export default function usePingLatency(
  connection?: MessageChannel<
    { ping: Converter<number> },
    { ping: Converter<number> }
  >,
  pingIntervalMs = 100,
  reportPingNumber = 20
) {
  const outstandingPing = useRef<boolean>(false);
  const pingInterval = useRef<number>();
  const pings = useRef<number[]>([]);
  const [latency, setLatency] = useState(0);
  useEffect(() => {
    if (connection == null) {
      return;
    }
    pingInterval.current = window.setInterval(() => {
      if(outstandingPing.current){
        //A ping is already out, skip sending new ones until it's back.
        return;
      }
      connection.send("ping", performance.now());
      outstandingPing.current = true;
    }, pingIntervalMs);
    connection.on("ping", timeStamp => {
      outstandingPing.current = false;
      pings.current.push(performance.now() - timeStamp);
      if (pings.current.length >= reportPingNumber) {
        setLatency(
          Math.round(
            pings.current.reduce((acc, ping) => acc + ping, 0) /
              pings.current.length
          )
        );
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
