import { useState, useEffect } from "react";
import { MessageChannel, Converter } from "../messaging/setupMessageChannel";

//This is messed up, but by keeping sending ping packages over the channel, latency is keeped consistent and low.
//If nothing is sent for a couple of deciseconds, latency will start to vary wildly.
//This might have to do with my router (known to be shitty in the past)
export default function usePingLatency(
  connection?: MessageChannel<
    { ping: Converter<number> },
    { ping: Converter<number> }
  >,
  tickRateMs = 100,
  tickReportCount = 40
) {
  const [latency, setLatency] = useState<number>();
  useEffect(() => {
    if (connection == null) {
      return;
    }
    let sentPings = 0;
    let receivedPings = 0;
    const pings = new Uint8Array(tickReportCount);
    const pingInterval = window.setInterval(() => {
      if (sentPings > receivedPings) {
        //A ping is already out, skip sending new ones until it's back.
        return;
      }
      connection.send("ping", performance.now());
      sentPings++;
    }, tickRateMs);
    connection.on("ping", (timeStamp) => {
      pings[receivedPings] = performance.now() - timeStamp;
      receivedPings++;
      if (receivedPings >= tickReportCount) {
        setLatency(
          Math.round(pings.reduce((acc, ping) => acc + ping, 0) / receivedPings)
        );
        receivedPings = 0;
        sentPings = 0;
      }
    });
    return () => {
      window.clearInterval(pingInterval);
      setLatency(undefined);
    };
  }, [connection, tickRateMs, tickReportCount]);
  return latency;
}
