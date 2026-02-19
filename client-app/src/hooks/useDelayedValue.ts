import { useEffect, useState } from "react";

export default function useDelayedValue<TValue>(value: TValue, delay: number) {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDelayed(value), delay);
    return () => clearTimeout(timeout);
  }, [value]);
  return delayed;
}
