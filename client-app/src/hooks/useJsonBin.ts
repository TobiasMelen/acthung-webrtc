import { useEffect, useCallback, useRef } from "react";
import useLocalStorage from "./useLocalStorage";

const API = "https://cors-anywhere.com/https://jsonbin-zeta.vercel.app/api/bins";

export default function useJsonBin<T>(
  localStorageKey: string,
  defaultValue: T,
  bucketId?: string
): readonly [T, (updater: (prev: T) => T) => Promise<void>] {
  const [localState, setLocalState] = useLocalStorage<T>(
    localStorageKey,
    defaultValue
  );
  const initialFetchDone = useRef(false);

  // Fetch initial value from online if bucketId exists
  useEffect(() => {
    if (!bucketId || initialFetchDone.current) return;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${API}/${bucketId}`);
        if (res.ok) {
          const data = await res.json();
          setLocalState(data);
        }
      } catch (e) {
        console.warn("Failed to fetch initial state from jsonbin:", e);
      } finally {
        initialFetchDone.current = true;
      }
    };

    fetchInitial();
  }, [bucketId, setLocalState]);

  const setState = useCallback(
    async (updater: (prev: T) => T): Promise<void> => {
      // No bucket id - just use localStorage with local state as prev
      if (!bucketId) {
        setLocalState((prev) => updater(prev));
        return;
      }

      try {
        // Always fetch current value from online
        const res = await fetch(`${API}/${bucketId}`);
        let prevValue: T = defaultValue;

        if (res.ok) {
          prevValue = await res.json();
        }

        // Apply the updater with the online value
        const newValue = updater(prevValue);

        // Save to online
        await fetch(`${API}/${bucketId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newValue),
        });

        // Update local state
        setLocalState(newValue);
      } catch (e) {
        console.warn("Failed to sync with jsonbin:", e);
        // Fallback to local state update
        setLocalState((prev) => updater(prev));
      }
    },
    [bucketId, defaultValue, setLocalState]
  );

  return [localState, setState] as const;
}
