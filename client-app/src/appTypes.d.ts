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

type Async<T extends (...params: any[]) => any> = T extends (
  ...params: any[]
) => any
  ? (...params: Parameters<T>) => Promise<ReturnType<T>>
  : never;

interface ImportMeta {
  env: Record<string, string>;
  glob<TModule = any>(pattern: string): Record<string, Promise<TModule>>;
  globEager<TModule = any>(pattern: string): Record<string, TModule>;
}

declare module "*?worker" {
  const workerImport: {
    new (): Worker;
  };
  export default workerImport;
}
