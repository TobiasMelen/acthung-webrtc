import { createChannelToWorker } from "../messaging/canvasWorkerMessaging";
import snakeGameContext from "./snakeGameContext";

const worker = new Worker("./offscreenGameWorker.ts");

const createOffScreenGame: Async<typeof snakeGameContext> = async (
  canvas,
  opts
) => {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(
      `Supplied canvas is of type ${canvas}, HTMLCanvasElement was expected. Only HTMLCanvasElement can be transferred offscreen`
    );
  }
  const offscreenCanvas = canvas.transferControlToOffscreen();
  worker.postMessage(offscreenCanvas, [offscreenCanvas]);
  const channel = createChannelToWorker(worker);

  //HAHA, you little rebel-coder you. Are resolved promises noop-rejections? Who defined that?
  //Yes i'm writing snarky comments to my past self, so what? I'm insane.
  // await new Promise((res, rej) => {
  //   window.setTimeout(rej, 500);
  //   channel.on("canvasCreated", res);
  // });
  //Create single listener for snake collisioners and use dict to store all snakes.
  const snakeCollisionListeners = new Map<string, Function>();
  channel.on("snakeCollision", (id) => {
    snakeCollisionListeners.get(id)?.();
  });

  return {
    run() {
      channel.send("run", undefined);
    },
    stop() {
      channel.send("stop", undefined);
    },
    destroy() {
      channel.send("destroy", undefined);
    },
    inputSnakeData({ id, color, onCollision }) {
      channel.send("inputSnakeData", { id, color });
      snakeCollisionListeners.set(id, onCollision);
      return (turn: number) => {
        channel.send("turn", { id, turn });
      };
    },
  };
};

export default createOffScreenGame;
