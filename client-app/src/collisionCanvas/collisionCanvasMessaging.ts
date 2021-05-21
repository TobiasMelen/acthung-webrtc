import { Converter, MessageChannel } from "../messaging/setupMessageChannel";
import { jsonConverter, stringConverter } from "../messaging/valueConverters";

export const messagesToTracker = {
  canvasInfo: jsonConverter as Converter<{
    width: number;
    height: number;
    scaleFactor: number;
    lineWidth: number;
  }>,
  positionData: jsonConverter as Converter<
    { id: string; x: number; y: number; fill?: string }[]
  >,
};
export const messagesFromTracker = {
  reportCollision: stringConverter,
};

export type TrackerMessageChannel = MessageChannel<
  typeof messagesToTracker,
  typeof messagesFromTracker
>;
