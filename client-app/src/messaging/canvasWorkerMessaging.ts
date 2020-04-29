import {
  jsonConverter,
  voidConverter,
  stringConverter,
} from "./valueConverters";
import setupMessageChannel, { Converter } from "./setupMessageChannel";

const messagesToWorker = {
  turn: {
    serialize(value: { id: string; turn: number }) {
      return `${value.id};${value.turn}`;
    },
    deserialize(value: string) {
      const split = value.split(";");
      return { id: split[0], turn: parseFloat(split[1]) };
    },
  },
  run: voidConverter,
  stop: voidConverter,
  destroy: voidConverter,
  inputSnakeData: jsonConverter as Converter<{ id: string; color: string }>,
};

const messageFromWorker = {
  snakeCollision: stringConverter,
  canvasCreated: voidConverter,
};

function hijackWorker(worker: Worker | DedicatedWorkerGlobalScope) {
  const workerOriginalHandler = worker.onmessage;
  return setupMessageChannel({
    send: worker.postMessage.bind(worker),
    triggerReceive(trigger) {
      worker.onmessage = (ev) => trigger(ev.data);
    },
    destroy() {
      worker.onmessage = workerOriginalHandler;
      // terminate();
    },
  });
}

export function createChannelToWorker(
  ...params: Parameters<typeof hijackWorker>
) {
  return hijackWorker(...params)(messagesToWorker, messageFromWorker);
}

export function createChannelFromWorker(
  ...params: Parameters<typeof hijackWorker>
) {
  return hijackWorker(...params)(messageFromWorker, messagesToWorker);
}
