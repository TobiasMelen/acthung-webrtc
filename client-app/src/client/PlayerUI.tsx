import {
  CSSProperties,
  useState,
  SyntheticEvent,
  PropsWithChildren
} from "react";
import React from "react";
import Triangle, { TriangleDirection } from "./Triangle";
import useMediaMatch from "../useMediaMatch";
import PlayerLayout from "./PlayerLayout";

type Props = PropsWithChildren<{
  latency: number;
  color: CSSProperties["color"];
  setTurn(turn: number): void;
}>;

export default function SnakeControls({ setTurn, color, children }: Props) {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [minusPressed, setMinusPressed] = useState(false);
  const [plusPressed, setPlusPressed] = useState(false);
  const arrowDirections = useMediaMatch<[TriangleDirection, TriangleDirection]>(
    {
      "(orientation: landscape)": ["left", "right"],
      "(orientation: portrait)": ["up", "down"]
    }
  )[0];

  // I "layman benchmarked" using hooks here.
  // creating a memo with the same code and currentTurn as dep is moot since it's regenerated everytime this renders.
  // the other option would be to wait until state commital before passing current turn to setTurn (online)
  // state commits can happen with some delay however, and until this shows a performance issue i see no need.
  const useInputHandlers = (
    value: number,
    setPress: (press: boolean) => void
  ) => {
    const handle = (press: boolean) => (ev: SyntheticEvent) => {
      ev.preventDefault();
      setPress(press);
      const newTurnValue = currentTurn + (press ? value : -value);
      setTurn(newTurnValue);
      setCurrentTurn(newTurnValue);
    };
    return {
      onPress: handle(true),
      onRelease: handle(false)
    };
  };
  const turnMinus = useInputHandlers(-1, setMinusPressed);
  const turnPlus = useInputHandlers(1, setPlusPressed);

  return (
    <PlayerLayout centered={false}>
      <TurnButton
        color={color}
        direction={arrowDirections?.[0] ?? "left"}
        pressed={minusPressed}
        handler={turnMinus}
      />
      <div>{children}</div>
      <TurnButton
        color={color}
        direction={arrowDirections?.[1] ?? "right"}
        pressed={plusPressed}
        handler={turnPlus}
      />
    </PlayerLayout>
  );
}

const TurnButton = ({
  color,
  pressed,
  handler,
  direction
}: {
  color?: string;
  pressed: boolean;
  direction: TriangleDirection;
  handler: {
    onPress(e: SyntheticEvent): void;
    onRelease(e: SyntheticEvent): void;
  };
}) => (
  <div
    style={{
      padding: "0.5em",
      flexBasis: "33%",
      alignSelf: "constrain",
      flexGrow: 0,
      flexShrink: 10,
      WebkitUserSelect: "none",
      touchAction: "none"
    }}
    onTouchStart={handler.onPress}
    onTouchEnd={handler.onRelease}
  >
    <Triangle
      direction={direction}
      stroke={color}
      fill={pressed ? color : undefined}
    />
  </div>
);
