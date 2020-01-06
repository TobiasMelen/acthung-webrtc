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

export const ALL_COLORS = ["#3f5", "#f24", "#46f", "#ef2", "#d3f", "#f9b", "#fff"];
