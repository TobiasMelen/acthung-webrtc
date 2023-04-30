import { useState, useMemo, useEffect } from "react";

export type MediaQueryMatch<TValue extends {}> = { [query: string]: TValue };

export default function useMediaMatch<TValue extends {}>(
  matchObject: MediaQueryMatch<TValue>
) {
  const mediaQueries = useMemo(
    () => Object.keys(matchObject).map((key) => matchMedia(key)),
    [matchObject]
  );
  const [matches, setMatches] = useState(
    new Set<string>(
      mediaQueries.filter((query) => query.matches).map((query) => query.media)
    )
  );
  useEffect(
    () =>
      mediaQueries.forEach((query) =>
        query.addListener((ev) =>
          setMatches((matches) => {
            const op: (value: string) => void = ev.matches
              ? matches.add
              : matches.delete;
            op.call(matches, ev.media);
            //React-pleasing shallow-copy
            return new Set(matches);
          })
        )
      ),
    [matchObject]
  );
  return useMemo(() => {
    let result = [] as TValue[];
    matches.forEach((match) => {
      const value = matchObject[match];
      if (value != null) {
        result.push(value);
      }
    });
    return result;
  }, [matches, matchObject]);
}
