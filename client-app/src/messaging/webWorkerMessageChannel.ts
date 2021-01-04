import setupMessageChannel, {
  ConverterCollection,
} from "./setupMessageChannel";

export const getWorkerChannelHooks = (worker: Worker | DedicatedWorkerGlobalScope) => {
  const eventHandler = (ev: MessageEvent) => 
} 

export function createWebWorkerMessageChannel(
  worker: Worker | DedicatedWorkerGlobalScope
) {
  const workerOriginalHandler = worker.onmessage;
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
