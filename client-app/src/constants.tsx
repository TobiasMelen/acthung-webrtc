export const SIGNALING_URL =
  process.env.SIGNAL_URL ??
  (() => {
    throw new Error(
      "SIGNAL_URL for signaling server must be specified in env."
    );
  })();

export const DEFAULT_COLOR = "white";

export const DEFAULT_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`;

export const DEFAULT_FONT_FAMILY_MONOSPACE = `SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`

export const ALL_COLORS = ["#0f0", "#f00", "#00f", "#ff0", "#f0f", "#0ff", "#fff"];
