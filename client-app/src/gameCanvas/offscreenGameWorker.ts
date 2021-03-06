/// <reference lib="WebWorker" />
import { createChannelFromWorker } from "./offscreenGameMessages";
import snakeGameContext from "./snakeGameContext";

const setupMessageHandler = (worker: DedicatedWorkerGlobalScope) => (ev: MessageEvent) => {
  if (ev.data instanceof OffscreenCanvas) {
    const channel = createChannelFromWorker(
      worker
    );
    const game = snakeGameContext(ev.data);
    const turners = new Map<string, Function>();
    channel.on("turn", (data) => turners.get(data.id)?.(data.turn));
    channel.on("inputSnakeData", (data) =>
      turners.set(
        data.id,
        game.inputSnakeData({
          ...data,
          onCollision: () => channel.send("snakeCollision", data.id),
        })
      )
    );
    channel.on("run", game.run);
    channel.on("stop", game.stop);
    channel.on("destroy", () => {
      game.destroy();
      onmessage = setupMessageHandler(worker);
    });
    channel.send("canvasCreated", undefined);
  }
};

onmessage = setupMessageHandler(self as DedicatedWorkerGlobalScope);
