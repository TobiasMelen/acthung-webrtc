import { createChannelToWorker } from "../messaging/canvasWorkerMessaging";

export type SnakeInput = {
  id: string;
  color: string;
  onCollision: () => void;
};

export type CanvasRules = typeof defaultRules;

const defaultRules = {
  snakeSpeed: 1.5,
  snakeRadius: 3.5,
  turnRadius: 0.045,
  startPositionSpread: 0.5,
  borderColor: "#fff",
  chanceToBecomeAHole: 0.01,
  holeDuration: 20
};

const worker = new Worker("./offscreenSnakeCanvasWorker.ts");

export default async function createOffScreenSnakeCanvas(
  canvas: HTMLCanvasElement,
  snakeInputs: SnakeInput[],
  rules?: Partial<typeof defaultRules>
) {
  rules = {...defaultRules, ...rules};
  const offscreenCanvas = canvas.transferControlToOffscreen();
  //@ts-ignore
  worker.postMessage(offscreenCanvas, [offscreenCanvas]);
  const channel = createChannelToWorker(worker);
  await new Promise((res, rej) => {
    window.setTimeout(rej, 500);
    channel.on("canvasCreated", res)
  });
  return {
    run: channel.send("run", ""),
    stop: channel.send("stop", ""),
    snakeTurners: snakeInputs.map(({ id }) => (turn: number) => {
      channel.send("turn", { id, turn });
    }),
    destroy: channel.send("destroy", "")
  };
}
