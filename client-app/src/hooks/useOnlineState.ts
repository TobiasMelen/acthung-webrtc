import { useEffect, useRef, useCallback } from "react";
import useLocalStorage from "./useLocalStorage";

const API = "https://jsonblob.com/api/jsonBlob";

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    return aKeys.length === bKeys.length &&
      aKeys.every(k => deepEqual((a as any)[k], (b as any)[k]));
  }
  return false;
}

// Default merge: combine arrays, dedupe with deepEqual
function defaultMerge<T>(local: T, remote: T): T {
  if (Array.isArray(local) && Array.isArray(remote)) {
    const result = [...remote];
    for (const item of local) {
      if (!result.some(r => deepEqual(r, item))) result.push(item);
    }
    return result as T;
  }
  return local;
}

export default function useOnlineState<T>(
  key: string,
  defaultValue: T,
  merge: (local: T, remote: T) => T = defaultMerge
): readonly [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useLocalStorage<T>(key, defaultValue);
  const lastSyncRef = useRef<string | null>(null);
  const blobKey = `_blob_${key}`;

  const sync = useCallback(async (data: T) => {
    const json = JSON.stringify(data);
    if (json === lastSyncRef.current) return;

    try {
      const blobId = localStorage.getItem(blobKey);
      if (blobId) {
        const res = await fetch(`${API}/${blobId}`);
        if (res.ok) {
          const merged = merge(data, await res.json());
          await fetch(`${API}/${blobId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(merged),
          });
          if (!deepEqual(merged, data)) setState(merged);
          lastSyncRef.current = JSON.stringify(merged);
        }
      } else {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
        });
        const id = res.headers.get("Location")?.split("/").pop();
        if (id) localStorage.setItem(blobKey, id);
        lastSyncRef.current = json;
      }
    } catch (e) {
      console.warn("Online sync failed:", e);
    }
  }, [blobKey, merge, setState]);

  useEffect(() => { sync(state); }, []);
  useEffect(() => {
    const t = setTimeout(() => sync(state), 1000);
    return () => clearTimeout(t);
  }, [state, sync]);

  return [state, setState] as const;
}
