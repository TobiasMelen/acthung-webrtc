import { createChannelToWorker } from "./offscreenGameMessages";
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
  const snakeCollisionHandlers = new Map<string, Function>();
  channel.on("snakeCollision", (id) => {
    snakeCollisionHandlers.get(id)?.();
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
    addTrackingChannel(trackingChannel){

    },
    inputSnakeData({ id, color, onCollision }) {
      channel.send("inputSnakeData", { id, color });
      snakeCollisionHandlers.set(id, onCollision);
      return (turn: number) => {
        channel.send("turn", { id, turn });
      };
    },
  };
};

export default createOffScreenGame;
