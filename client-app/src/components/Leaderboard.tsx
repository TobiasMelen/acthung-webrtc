import React from "react";

type LeaderboardEntry = {
  score: number;
  name: string;
  color: string;
  timestamp: number;
};

function LeaderboardLine({
  entry,
  isYourScore,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
  isYourScore: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1em",
      }}
    >
      <span>{index + 1}.</span>
      <span
        style={{
          color: entry.color,
          display: "flex",
          alignItems: "center",
          gap: "0.5em",
        }}
      >
        <span>{entry.name}</span>
        {isYourScore && (
          <span
            style={{ color: "white", fontSize: "0.5em", marginTop: '0.2em' }}
          >
            ← YOU
          </span>
        )}
      </span>
      <span style={{ color: entry.color, flex: 1, textAlign: "right" }}>
        {entry.score}
      </span>
    </div>
  );
}

export default function Leaderboard({
  entries,
  playerName,
  playerColor,
  remainingTime,
}: {
  entries: LeaderboardEntry[];
  playerName: string;
  playerColor: string;
  remainingTime?: number;
}) {
  const yourEntryIndex = entries.findIndex(
    (e) => e.name === playerName && e.color === playerColor,
  );
  const yourEntry = yourEntryIndex !== -1 ? entries[yourEntryIndex] : null;
  const isInTop3 = yourEntryIndex < 3;
  const displayEntries = entries.slice(0, 3);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        fontSize: "4em",
        padding: "0.5em 0",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div>BEST SCORES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3em" }}>
        {displayEntries.map((entry, index) => (
          <LeaderboardLine
            key={entry.timestamp}
            entry={entry}
            index={index}
            isYourScore={
              entry.name === playerName && entry.color === playerColor
            }
          />
        ))}
        {!isInTop3 && yourEntry && (
          <>
            <div>...</div>
            <LeaderboardLine
              key={yourEntry.timestamp}
              entry={yourEntry}
              index={yourEntryIndex}
              isYourScore={true}
            />
          </>
        )}
      </div>
      {remainingTime != null && <div>Next round in {remainingTime}</div>}
    </div>
  );
}
