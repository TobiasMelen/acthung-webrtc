import React, { CSSProperties, useState } from "react";

type Props = {
  isConnected: boolean;
  onCast(): Promise<unknown>;
  style?: CSSProperties;
};

const buttonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  padding: "0.5em",
  opacity: 0.8,
  transition: "opacity 150ms ease-in",
};

const iconStyle: CSSProperties = {
  width: "2em",
  height: "2em",
  fill: "currentColor",
};

export default function ChromecastButton({ isConnected, onCast, style }: Props) {
  const [casting, setCasting] = useState(false);

  const handleClick = async () => {
    setCasting(true);
    await onCast();
    setCasting(false);
  };

  return (
    <button
      style={{ ...buttonStyle, ...style, opacity: casting ? 0.5 : 0.8 }}
      onClick={handleClick}
      disabled={casting}
      title={isConnected ? "Connected to Chromecast" : "Cast to Chromecast"}
      aria-label={isConnected ? "Connected to Chromecast" : "Cast to Chromecast"}
    >
      <svg
        viewBox="0 0 24 24"
        style={{
          ...iconStyle,
          color: isConnected ? "#4CAF50" : "inherit",
        }}
      >
        {isConnected ? (
          <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        ) : (
          <path d="M21 3H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11z" />
        )}
      </svg>
    </button>
  );
}
