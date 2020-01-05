type PlayerState = {
  name: string;
  color: string;
  score: number;
  ready: boolean;
  state: "joining" | "playing" | "dead";
  latency: number;
};

type GameState = {
  colorAvailability: { [color: string]: boolean };
};
