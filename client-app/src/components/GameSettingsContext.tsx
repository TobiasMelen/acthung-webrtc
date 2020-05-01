import React, {
  createContext,
  SetStateAction,
  Dispatch,
  PropsWithChildren,
} from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const defaultSettings = {
  snakeSpeed: 3.3,
  lineWidth: 8,
  turnRadius: 0.05,
  startPositionSpread: 0.5,
  startingHoleChancePercantage: -5,
  holeDuration: 10,
  maxVerticalResolution: 1080,
};

export type GameSettings = typeof defaultSettings;

export const GameSettingsContext = createContext([
  defaultSettings,
  (() => {}) as Dispatch<SetStateAction<GameSettings>>,
] as const);

export function GameSettingsProvider({ children }: PropsWithChildren<{}>) {
  const state = useLocalStorage("gameSettings", defaultSettings);
  return (
    <GameSettingsContext.Provider value={state}>
      {children}
    </GameSettingsContext.Provider>
  );
}
