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
 * @param reconnectAttempts - Number of retry attempts before failing (default: 5)
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
  const [retries, setRetries] = useState(0);
  const listenersRef = useRef<Set<(data: any) => void>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageQueueRef = useRef<any[]>([]);

  // Reset on room/id change
  useEffect(() => {
    setRetries(0);
    setStatus("connecting");
    abortControllerRef.current?.abort();
    messageQueueRef.current = [];
  }, [room, myId, enabled]);

  // Long-poll for messages
  useEffect(() => {
    if (!enabled || !room || !myId || retries > reconnectAttempts) {
      if (retries > reconnectAttempts) {
        setStatus("failed");
      }
      return;
    }

    let mounted = true;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Mark as connected immediately - ppng.io is stateless
    setStatus("connected");

    // Flush queued messages
    const queue = messageQueueRef.current;
    messageQueueRef.current = [];
    queue.forEach((msg) => postMessage(room, msg));

    const myChannel = `${room}/${myId}`;
    const url = `${PPNG_BASE}/${encodeURIComponent(myChannel)}`;

    const poll = async () => {
      while (mounted && !abortController.signal.aborted) {
        try {
          const response = await fetch(url, {
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
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
        } catch (err: any) {
          if (err.name === "AbortError") {
            break;
          }
          // Connection error, retry after delay
          if (mounted) {
            setRetries((r) => r + 1);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    };

    poll();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [enabled, room, myId, retries, reconnectAttempts]);

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

    if (retries > reconnectAttempts) {
      return { status: "failed" as const };
    }

    if (status !== "connected") {
      return { status: "connecting" as const };
    }

    return {
      status: "connected" as const,
      send,
      addListener,
    };
  }, [enabled, room, retries, reconnectAttempts, status, send, addListener]);
}
