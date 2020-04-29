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

type PromiseResult<T> = T extends Promise<infer Result> ? Result : never;

type Async<T extends (...params: any[]) => any> = T extends (...params: any[]) => any
  ? (...params: Parameters<T>) => Promise<ReturnType<T>>
  : never;
