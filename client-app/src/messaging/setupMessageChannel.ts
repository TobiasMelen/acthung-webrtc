/**
 * While this looks a bit jacked, it is just pubsub bindable to arbitrary string event interface using typed, custom, serializing.
 * Used by RTCDataChannel connections and webworkers. Data format is "MESSAGE_TYPE;MESSAGE_DATA_WITH_CONFIGURED_SERIALIZER"
 * Why not use JSON like a normal person?
 * Earlier i just put everything from UDP/Worker-messaging into JSON, but the 1ms added here and there actually adds upp to quite a bit of CPU time
 * A lot of events (turns/pings) don't have associated data, parsing json just to read a "type" prop of result.
 * Looked into protobufs but it looked very cargo-culty to me and not really established in JS-land.
 */

export type Converter<TResult> = {
  serialize(result: TResult): string;
  deserialize(input: string): TResult;
};

export type ConverterCollection = Record<string, Converter<any>>;

type EventHooks<TExtraSendParams extends any[] = []> = {
  send(input: string, ...params: TExtraSendParams): void;
  triggerReceive(trigger: (input: string) => void): void;
  destroy(): void;
};

type ConverterType<
  TConverter extends Converter<any>
> = TConverter extends Converter<infer Result> ? Result : never;

export type MessageChannel<
  TSend extends ConverterCollection,
  TReceive extends ConverterCollection,
  TExtraSendParams extends any[] = []
> = {
  send<TMessage extends keyof TSend>(
    type: TMessage,
    data: ConverterType<TSend[TMessage]>,
    ...extraParams: TExtraSendParams
  ): void;
  on<TMessage extends keyof TReceive>(
    type: TMessage,
    fn: (data: ConverterType<TReceive[TMessage]>) => void
  ): void;
  off<TMessage extends keyof TReceive>(
    type: TMessage,
    fn: (data: ConverterType<TReceive[TMessage]>) => void
  ): void;
  destroy(): void;
};

//HoF just to cut down on TS generic bloat.
export default function setupMessageChannel<
  TExtraSendParams extends any[] = []
>(channelHooks: EventHooks<TExtraSendParams>) {
  return <
    TSend extends ConverterCollection,
    TReceive extends ConverterCollection
  >(
    send: TSend,
    receive: TReceive,
    ...bounce: string[]
  ): MessageChannel<TSend, TReceive, TExtraSendParams> => {
    const bounceSet = new Set(bounce);
    const listeners = new Map<keyof TReceive, Function[]>();
    //bind a single event listener to "outer event" and filter on serialized message type.
    channelHooks.triggerReceive(input => {
      const indexOfMessageSeparator = input.indexOf(";");
      const messageType =
        indexOfMessageSeparator && input.substring(0, indexOfMessageSeparator);
      //No message type could be parsed, exit out
      if (!messageType) {
        return;
      }
      //if this is a configured bounce message, bounce it directly as it came.
      if (bounceSet.has(messageType)) {
        //@ts-ignore no params here
        channelHooks.send(input);
      }
      //check if anyones is listening before parsing message data and invoking listeners.
      const messageListeners = listeners.get(messageType);
      if (messageListeners?.length) {
        const messageData = receive[messageType]?.deserialize(
          input.substring(indexOfMessageSeparator + 1)
        );
        messageListeners.forEach(listener => listener(messageData));
      }
    });
    return {
      send(type, data, ...extraParams) {
        console.log("sending", data);
        const message = `${type};${send[type].serialize(data)}`;
        channelHooks.send(message, ...extraParams);
      },
      on(type, fn) {
        if (!listeners.has(type)) {
          listeners.set(type, []);
        }
        listeners.get(type)?.push(fn);
      },
      off(type, fn) {
        const fnIndex = listeners.get(type)?.indexOf(fn);
        if (fnIndex != null && fnIndex != -1) {
          listeners.get(type)?.splice(fnIndex, 1);
        }
      },
      destroy: channelHooks.destroy
    };
  };
}
