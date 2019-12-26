import { useEffect, useRef } from "react";

export default function useEffectWithPrevDeps<Deps extends readonly any[]>(
  effect: (prevDeps?: Deps) => void | (() => void | undefined),
  deps: Deps
) {
  const prevDeps = useRef<Deps>();
  useEffect(() => {
    const returnValue = effect(prevDeps.current);
    prevDeps.current = deps;
    return returnValue;
  }, [deps]);
}
