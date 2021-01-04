import { createWebWorkerMessageChannel } from "../messaging/webWorkerMessageChannel";
import { Converter } from "../messaging/setupMessageChannel";
import {
  voidConverter,
  jsonConverter,
  stringConverter,
} from "../messaging/valueConverters";

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

export function createChannelToWorker(
  worker: Parameters<typeof createWebWorkerMessageChannel>[0]
) {
  return createWebWorkerMessageChannel(worker)(
    messagesToWorker,
    messageFromWorker
  );
}

export function createChannelFromWorker(
  worker: Parameters<typeof createWebWorkerMessageChannel>[0]
) {
  return createWebWorkerMessageChannel(worker)(
    messageFromWorker,
    messagesToWorker
  );
}
