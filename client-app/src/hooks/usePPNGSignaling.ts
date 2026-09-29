import { useEffect, useRef, useState, useCallback, useMemo } from "react";

const PPNG_BASE = "https://ppng.io";

async function postMessage(room: string, message: any) {
  const { data, to, from } = message;

  // Send to the RECIPIENT's channel (to field), not our room
  const targetChannel = `${room}/${to}`;
  // Build message with metadata (explicitly copy RTCSessionDescription properties)
  const payload = {
    ...data,
    _to: to,
    _from: from,
  };

  try {
    await fetch(`${PPNG_BASE}/${encodeURIComponent(targetChannel)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore send errors
  }
}

/**
 * Signaling hook using ppng.io HTTP long-polling.
 *
 * @param room - The room/channel to join
 * @param myId - The identifier to listen as (messages with `to: myId` will be delivered)
 * @param enabled - Set to false to disable connection (default: true)
 * @param reconnectAttempts - Consecutive failures before reporting "failed", retrying continues (default: 5)
 */
export default function usePPNGSignaling(
  room: string | null,
  myId: string | null,
  enabled = true,
  reconnectAttempts = 5,
) {
  const [status, setStatus] = useState<"connecting" | "connected" | "failed">(
    "connecting",
  );
  const listenersRef = useRef<Set<(data: any) => void>>(new Set());
  const messageQueueRef = useRef<any[]>([]);

  // Long-poll for messages
  useEffect(() => {
    setStatus("connecting");
    messageQueueRef.current = [];
    if (!enabled || !room || !myId) {
      return;
    }

    const abortController = new AbortController();

    // ppng.io is stateless, so any successful request means we're connected.
    const markConnected = () => {
      setStatus("connected");
      const queue = messageQueueRef.current;
      messageQueueRef.current = [];
      queue.forEach((msg) => postMessage(room, msg));
    };
    markConnected();

    const myChannel = `${room}/${myId}`;
    const url = `${PPNG_BASE}/${encodeURIComponent(myChannel)}`;

    const poll = async () => {
      //Lobbies can idle for hours, so only consecutive failures count and we never stop retrying.
      let failures = 0;
      while (!abortController.signal.aborted) {
        try {
          const response = await fetch(url, {
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          if (failures > 0) {
            failures = 0;
            markConnected();
          }

          const text = await response.text();
          if (text) {
            try {
              const message = JSON.parse(text);
              // Filter by _to field - only deliver if addressed to us
              if (message._to === myId || !message._to) {
                // Reconstruct message in expected format
                const { _to, _from, ...data } = message;
                const reconstructed = { data, from: _from, to: _to };
                listenersRef.current.forEach((cb) => cb(reconstructed));
              }
            } catch {
              // Ignore parse errors
            }
          }
        } catch {
          if (abortController.signal.aborted) {
            break;
          }
          failures++;
          if (failures > reconnectAttempts) {
            setStatus("failed");
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * 2 ** (failures - 1), 30000)),
          );
        }
      }
    };

    poll();

    return () => abortController.abort();
  }, [enabled, room, myId, reconnectAttempts]);

  const send = useCallback(
    (message: any) => {
      if (!room) return;

      if (status !== "connected") {
        // Queue message if not connected yet
        messageQueueRef.current.push(message);
        return;
      }

      postMessage(room, message);
    },
    [room, status],
  );

  const addListener = useCallback((listener: (data: any) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return useMemo(() => {
    if (!enabled || !room) {
      return { status: "connecting" as const };
    }

    if (status !== "connected") {
      return { status };
    }

    return {
      status: "connected" as const,
      send,
      addListener,
    };
  }, [enabled, room, status, send, addListener]);
}
