export const typedEntries = Object.entries as <T, TKey extends keyof T>(
  o: T
) => [Extract<TKey, string>, T[TKey]][];

export const typedKeys = Object.keys as <T>(o: T) => (keyof T)[];

export function extractObjectDiff<T>(source: T, update: T): Partial<T> {
  return typedEntries(update ?? {}).reduce((acc, [key, value]) => {
    if (source?.[key] !== value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

export function inlineThrow(err: string | Error):never {
  throw typeof err === "string" ? new Error(err) : err;
}
