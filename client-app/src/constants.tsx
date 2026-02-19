export const SIGNALING_URL =
  import.meta.env.VITE_SIGNAL_URL ??
  (() => {
    throw new Error(
      "VITE_SIGNAL_URL for signaling server must be specified in env."
    );
  })();

export const DEFAULT_COLOR = "white";

export const DEFAULT_FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif`;

export const DEFAULT_FONT_FAMILY_MONOSPACE = `SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`;

export const ALL_COLORS = [
  "#3f5",
  "#f24",
  "#46f",
  "#ef2",
  "#d3f",
  "#f9b",
  "#fff",
];

export const DEFAULT_RTC_PEER_CONFIG: RTCConfiguration = {
  iceCandidatePoolSize: 6,
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302"] },
    ...(import.meta.env.VITE_TURN_USERNAME && import.meta.env.VITE_TURN_CREDENTIAL
      ? [
          {
            urls: [
              "turn:global.relay.metered.ca:80",
              "turn:global.relay.metered.ca:80?transport=tcp",
              "turn:global.relay.metered.ca:443",
              "turns:global.relay.metered.ca:443?transport=tcp",
            ],
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
};
