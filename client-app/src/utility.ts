export const typedEntries = Object.entries as <T, TKey extends keyof T>(
  o: T
) => [Extract<TKey, string>, T[TKey]][];

export const typedKeys = Object.keys as <T>(o: T) => (keyof T)[];

export function extractObjectDiff<T>(
  source: T,
  update: T,
  ...omitTypes: string[]
): Partial<T> {
  return typedEntries(update ?? {})
    .filter((entry) => !omitTypes.includes(typeof entry[1]))
    .reduce((acc, [key, value]) => {
      if (source?.[key] !== value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Partial<T>);
}

export function inlineThrow(err: string | Error): never {
  throw typeof err === "string" ? new Error(err) : err;
}

//https://gist.github.com/LeverOne/1308368
export function uuidV4() {
  let result = "";
  for (
    let step = 0;
    step++ < 36;
    result +=
      (step * 51) & 52
        ? (step ^ 15 ? 8 ^ (Math.random() * (step ^ 20 ? 16 : 4)) : 4).toString(
            16
          )
        : "-"
  );
  return result;
}
