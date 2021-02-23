import setupMessageChannel, {
  ConverterCollection,
} from "./setupMessageChannel";

export function createWebWorkerMessageChannel(
  worker: Worker | DedicatedWorkerGlobalScope
) {
  return <
    SendMessages extends ConverterCollection,
    ReceiveMessages extends ConverterCollection
  >(
    sends: SendMessages,
    recieves: ReceiveMessages
  ) =>
    setupMessageChannel({
      send: worker.postMessage.bind(worker),
      bindReceive(receive) {
        const listener = (ev: any) => receive(ev.data);
        worker.addEventListener("message", listener);
        return () => worker.removeEventListener("message", listener)
      },
    })(sends, recieves);
}
