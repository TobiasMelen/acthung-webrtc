/// <reference lib="WebWorker" />
import { createWebWorkerMessageChannel } from "../messaging/webWorkerMessageChannel";
import createCollisionGrid from "./collisionGrid";
import {
  messagesFromCollisionGrid,
  messagesToCollisionGrid,
} from "./collisionGridMessaging";

const channel = createWebWorkerMessageChannel(self as DedicatedWorkerGlobalScope)(
  messagesFromCollisionGrid,
  messagesToCollisionGrid,
);

let grid: ReturnType<typeof createCollisionGrid> | undefined;

channel.on("init", (config) => {
  grid = createCollisionGrid(config);
});

channel.on("frame", (frame) => {
  grid?.processFrame(frame).forEach(({ index, hit }) => channel.send(hit, index));
});
