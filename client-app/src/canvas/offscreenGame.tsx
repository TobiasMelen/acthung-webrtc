import { createChannelToWorker } from "../messaging/canvasWorkerMessaging";
import snakeGameContext from "./snakeGameContext";
import OffscreenGameWorker from "./offscreenGameWorker?worker";

const worker = new OffscreenGameWorker();

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