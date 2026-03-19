import { useMemo } from "react";
import { SIGNALING_URL } from "../constants";
import useJsonWebsocket from "./useJsonWebsocket";
import usePPNGSignaling from "./usePPNGSignaling";

export type SignalingResult =
  | { status: "connecting" | "failed"; supportsTrickleIce: boolean }
  | {
      status: "connected";
      supportsTrickleIce: boolean;
      send: (data: any) => void;
      addListener: (listener: (data: any) => void) => () => void;
    };

/**
 * Unified signaling hook that uses WebSocket server if VITE_SIGNAL_URL is set,
 * otherwise falls back to ppng.io HTTP long-polling signaling.
 *
 * @param room - The room/lobby name to join
 * @param myId - Optional identifier for this peer (defaults to room).
 *               For lobbies: omit or pass the same as room
 *               For players: pass the player's unique ID
 * @param enabled - Set to false to disable/disconnect (default: true)
 *
 * @returns SignalingResult with `supportsTrickleIce` indicating whether
 *          ICE candidates can be sent incrementally (true for WebSocket,
 *          false for ppng - must gather all candidates before sending offer/answer)
 */
export default function useSignaling(
  room: string,
  myId?: string,
  enabled = true,
): SignalingResult {
  const effectiveId = myId ?? room;

  // Build URL for WebSocket backend
  const wsUrl = enabled ? `${SIGNALING_URL}/${effectiveId}` : undefined;

  // Conditionally call hooks based on build-time constant
  // This is safe because SIGNALING_URL never changes at runtime
  if (!SIGNALING_URL) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = usePPNGSignaling(room, effectiveId, enabled);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(
      (): SignalingResult => ({ ...result, supportsTrickleIce: false }),
      [result],
    );
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useJsonWebsocket(wsUrl);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(
      (): SignalingResult => ({ ...result, supportsTrickleIce: false }),
      [result],
    );
  }
}
