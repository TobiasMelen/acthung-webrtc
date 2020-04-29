import { useState, useCallback, useRef, useMemo } from "react";

export default function useSecondTicker(seconds: number = 0) {
  // This is one confused hook bonanza.
  // When your second counter is more advanced than your udp connection manager you should stop coding.
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const ticker = useRef<number>();
  const tickCallback = useRef((secondsLeft: number) => {});
  const doneCallback = useRef(() => {});
  const onTick = useCallback(
    (fn: typeof tickCallback["current"]) => {
      tickCallback.current = fn;
    },
    [tickCallback]
  );
  const onDone = useCallback(
    (fn: typeof doneCallback["current"]) => {
      doneCallback.current = fn;
    },
    [doneCallback]
  );
  const pause = useCallback(() => {
    clearTimeout(ticker.current);
    ticker.current = undefined;
  }, []);
  const start = useCallback(
    (seconds?: number) => {
      pause();
      seconds != null && setSecondsLeft(seconds);
      ticker.current = window.setTimeout(tick, 1000);
    },
    [pause]
  );
  const tick = useCallback(() => {
    setSecondsLeft((secondsLeft) => {
      const newValue = secondsLeft - 1 || 0;
      tickCallback.current(newValue);
      if (newValue > 0) {
        setTimeout(tick, 1000);
      } else {
        ticker.current = undefined;
        setTimeout(doneCallback.current, 0);
      }
      return newValue;
    });
  }, []);
  const secondTicker = useMemo(
    () => ({
      secondsLeft,
      start,
      pause,
      isRunning: ticker.current != null,
      onDone,
      onTick,
    }),
    [secondsLeft, start, pause, ticker, onDone, onTick]
  );
  return secondTicker;
}
