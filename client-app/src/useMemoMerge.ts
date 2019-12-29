import { useMemo, DependencyList } from "react";

export function useMemoMerge<Objects extends (object | undefined)[]>(
  objects: Objects,
  deps?: DependencyList
) {
  return useMemo(() => {
    const nonNullObjects = objects.filter(obj => obj != null);
    if (nonNullObjects.length <= 1) {
      return nonNullObjects[0];
    }
    return Object.assign({}, ...nonNullObjects) as Objects[0];
  }, deps ?? objects);
}
