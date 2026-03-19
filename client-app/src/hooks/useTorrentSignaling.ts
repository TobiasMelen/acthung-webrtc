import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const TRACKERS = [
  "wss://tracker.webtorrent.dev",
  "wss://tracker.openwebtorrent.com"
];

const ANNOUNCE_INTERVAL = 30_000;
const RECONNECT_DELAY = 1000;

function generatePeerId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "-WR0001-";
  for (let i = result.length; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function topicToInfoHash(topic: string): string {
  // Simple hash function that works in non-secure contexts
  // Generates a 20-byte (40 hex char) deterministic hash
  const bytes = new Uint8Array(20);
  for (let i = 0; i < topic.length; i++) {
    const char = topic.charCodeAt(i);
    for (let j = 0; j < 20; j++) {
      // Mix character into each byte position
      bytes[j] = (bytes[j] * 31 + char + j * 17) & 0xff;
    }
  }
  // Additional mixing passes for better distribution
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < 20; i++) {
      bytes[i] = (bytes[i] * 31 + bytes[(i + 1) % 20] + pass) & 0xff;
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Alternative to useJsonWebsocket that uses WebTorrent trackers for signaling.
 *
 * @param room - The room/topic to join (used to derive info_hash)
 * @param myId - The identifier to listen as (messages with `to: myId` will be delivered)
 * @param enabled - Set to false to disable connection (default: true)
 * @param reconnectAttempts - Number of retry attempts before failing (default: 5)
 *
 * Messages must include `to` field for routing. Only messages where `to` matches
 * myId will be delivered.
 */
export default function useTorrentSignaling(
  room: string | null,
  myId: string | null,
  enabled = true,
  reconnectAttempts = 5
) {

  const [retries, setRetries] = useState(0);
  const failedAllRetries = retries > reconnectAttempts;
  const [connectedCount, setConnectedCount] = useState(0);

  const peerId = useMemo(generatePeerId, []);
  const socketsRef = useRef<WebSocket[]>([]);
  const listenersRef = useRef<Set<(data: any) => void>>(new Set());
  const messageQueueRef = useRef<any[]>([]);
  const handledMessagesRef = useRef<Set<string>>(new Set());

  // Compute info_hash from room
  const infoHash = useMemo(() => (room ? topicToInfoHash(room) : null), [room]);

  // Reset on room/id change or when disabled
  useEffect(() => {
    setRetries(0);
    setConnectedCount(0);
    socketsRef.current.forEach((ws) => ws.close());
    socketsRef.current = [];
    handledMessagesRef.current.clear();
    messageQueueRef.current = [];
  }, [room, myId, enabled]);

  // Connect to trackers
  useEffect(() => {
    if (!enabled || !room || !infoHash || failedAllRetries) {
      return;
    }

    const sockets: WebSocket[] = [];
    let localConnectedCount = 0;

    const announce = (ws: WebSocket, extra?: object) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          action: "announce",
          info_hash: infoHash,
          peer_id: peerId,
          numwant: 10,
          ...extra,
        })
      );
    };

    const sendMessage = (ws: WebSocket, message: any) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      // Extract the SDP and metadata from the message
      const { data, to, from } = message;
      const offerId = generatePeerId();

      // RTCSessionDescription properties are getters, so explicitly copy them
      const offerWithMeta = {
        type: data.type,
        sdp: data.sdp,
        _to: to,
        _from: from,
      };

      ws.send(
        JSON.stringify({
          action: "announce",
          info_hash: infoHash,
          peer_id: peerId,
          offers: [
            {
              offer: offerWithMeta,
              offer_id: offerId,
            },
          ],
        })
      );
    };

    TRACKERS.forEach((trackerUrl) => {
      const ws = new WebSocket(trackerUrl);

      ws.onopen = () => {
        localConnectedCount++;
        setConnectedCount(localConnectedCount);
        announce(ws);

        // Flush message queue
        messageQueueRef.current.forEach((msg) => sendMessage(ws, msg));
        messageQueueRef.current = [];
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.info_hash !== infoHash) return;

          // Handle incoming offers (which contain our signaling messages)
          if (data.offer && data.offer_id && data.peer_id !== peerId) {
            const messageKey = `${data.peer_id}:${data.offer_id}`;
            if (handledMessagesRef.current.has(messageKey)) return;
            handledMessagesRef.current.add(messageKey);

            const offer = data.offer;
            // Extract metadata and reconstruct message format
            const { _to, _from, ...sdp } = offer;

            // Filter by _to field - only deliver if addressed to us
            if (_to === myId || !_to) {
              // Reconstruct message in expected format: { data: SDP, from?, to? }
              const message = { data: sdp, from: _from, to: _to };
              listenersRef.current.forEach((cb) => cb(message));
            }
          }

          // Handle answers (for bidirectional communication)
          if (data.answer && data.peer_id !== peerId) {
            const answer = data.answer;
            const { _to, _from, ...sdp } = answer;

            if (_to === myId || !_to) {
              const message = { data: sdp, from: _from, to: _to };
              listenersRef.current.forEach((cb) => cb(message));
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        localConnectedCount = Math.max(0, localConnectedCount - 1);
        setConnectedCount(localConnectedCount);

        if (localConnectedCount === 0) {
          // All connections lost, schedule retry
          setTimeout(() => {
            setRetries((r) => r + 1);
          }, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => ws.close();

      sockets.push(ws);
    });

    socketsRef.current = sockets;

    // Periodic announce to stay visible
    const interval = setInterval(() => {
      sockets.forEach((ws) => announce(ws));
    }, ANNOUNCE_INTERVAL);

    return () => {
      clearInterval(interval);
      sockets.forEach((ws) => ws.close());
    };
  }, [enabled, room, infoHash, peerId, myId, failedAllRetries, retries]);

  const send = useCallback(
    (message: any) => {
      const ws = socketsRef.current.find(
        (s) => s.readyState === WebSocket.OPEN
      );
      if (!ws || !infoHash) {
        // Queue message if not connected yet
        messageQueueRef.current.push(message);
        return;
      }

      // Extract the SDP and metadata from the message
      // Message format: { data: RTCSessionDescription, to?: string, from?: string }
      const { data, to, from } = message;
      const offerId = generatePeerId();

      // RTCSessionDescription properties are getters, so explicitly copy them
      const offerWithMeta = {
        type: data.type,
        sdp: data.sdp,
        _to: to,
        _from: from,
      };

      ws.send(
        JSON.stringify({
          action: "announce",
          info_hash: infoHash,
          peer_id: peerId,
          offers: [
            {
              offer: offerWithMeta,
              offer_id: offerId,
            },
          ],
        })
      );
    },
    [infoHash, peerId]
  );

  const addListener = useCallback((listener: (data: any) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const isConnected = connectedCount > 0 && infoHash !== null;

  if (!enabled || !room) {
    return { status: "connecting" as const };
  }

  if (failedAllRetries) {
    return { status: "failed" as const };
  }

  if (!isConnected) {
    return { status: "connecting" as const };
  }

  return {
    status: "connected" as const,
    send,
    addListener,
  };
}
