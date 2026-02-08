import { useEffect } from "react";

/**
 * Requests a screen wake lock to prevent the screen from dimming or sleeping.
 * Automatically re-acquires the lock when the page becomes visible again,
 * since the browser releases it when the tab is hidden.
 */
export default function useWakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.warn("Wake Lock request failed:", err);
      }
    };

    requestWakeLock();
    document.addEventListener("visibilitychange", requestWakeLock);

    return () => {
      document.removeEventListener("visibilitychange", requestWakeLock);
      wakeLock?.release();
    };
  }, []);
}
