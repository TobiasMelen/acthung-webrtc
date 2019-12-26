import { useEffect, useRef, DependencyList, EffectCallback } from "react";

export default function useEffectWithDeps<Deps extends DependencyList>(
  effect: (prevDeps?: Deps) => ReturnType<EffectCallback>,
  deps: Deps
) {
  const dependencyRef = useRef<Deps>();
  useEffect(() => {
    const prevDeps = dependencyRef.current;
    dependencyRef.current = deps;
    return effect(prevDeps);
  }, deps);
}
