import { jsonConverter, passValueConverter } from "./valueConverters";
import setupMessageChannel, {
  ConverterCollection,
  Converter
} from "./setupMessageChannel";

const messagesToWorker = {
  turn: {
    serialize(value: { id: string; turn: number }) {
      return `${value.id};${value.turn}`;
    },
    deserialize(value: string) {
      const split = value.split(";");
      return { id: split[0], turn: parseFloat(split[1]) };
    }
  },
  run: passValueConverter,
  stop: passValueConverter,
  destroy: passValueConverter,
  setup: jsonConverter
};

const messageFromWorker = {
  snakeCollision: passValueConverter,
  canvasCreated: passValueConverter,
};

function setupWorker(worker: Worker) {
  return setupMessageChannel({
    send: worker.postMessage as (
      message: any,
      transfer?: (Transferable | OffscreenCanvas)[]
    ) => void,
    triggerReceive(trigger) {
      worker.onmessage = ev => trigger(ev.data);
    }
  });
}

export function createChannelToWorker(worker: Worker) {
  return setupWorker(worker)(messagesToWorker, messageFromWorker);
}

export function createChannelFromWorker(worker: Worker) {
  return setupWorker(worker)(messageFromWorker, messagesToWorker);
}
