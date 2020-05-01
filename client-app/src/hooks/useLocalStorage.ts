import { useMemo, useState, useEffect } from "react";

export default function useLocalStorage<T>(
  localStorageKey: string,
  defaultValue: T
) {
  //Memo localstorage and json parse, could be expensive in browser
  const startingValue = useMemo(
    () =>
      localStorage?.[localStorageKey]
        ? JSON.parse(localStorage[localStorageKey])
        : defaultValue,
    []
  );
  const [state, setState] = useState<T>(startingValue);
  useEffect(() => {
    localStorage && (localStorage[localStorageKey] = JSON.stringify(state));
  }, [state]);
  return [state, setState] as const;
}
