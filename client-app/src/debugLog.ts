const maxLines = 20;
const lines: string[] = [];
const listeners = new Set<(lines: string[]) => void>();

export default function debugLog(...parts: unknown[]) {
  const text = parts
    .map((part) =>
      part instanceof Error
        ? `${part.name}: ${part.message}`
        : typeof part === "string"
          ? part
          : JSON.stringify(part),
    )
    .join(" ");
  console.debug(text);
  lines.push(`${(performance.now() / 1000).toFixed(1)} ${text}`);
  lines.splice(0, lines.length - maxLines);
  listeners.forEach((listener) => listener(lines.slice()));
}

export function subscribeDebugLog(listener: (lines: string[]) => void) {
  listeners.add(listener);
  listener(lines.slice());
  return () => {
    listeners.delete(listener);
  };
}
