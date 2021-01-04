import {
  MessageChannel,
  BindableMessageChannel,
  Converter,
} from "../messaging/setupMessageChannel";
import { jsonConverter, stringConverter } from "../messaging/valueConverters";
import { inlineThrow } from "../utility";

const messagesToTracker = {
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
const messagesFromTracker = {
  reportCollision: stringConverter,
};

export type TrackerMessageChannel = MessageChannel<
  typeof messagesToTracker,
  typeof messagesFromTracker
>;

export function createTrackerCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  channelCreator: BindableMessageChannel,
  checkCollisions: boolean
) {
  const channel = channelCreator(messagesFromTracker, messagesToTracker);
  const context =
    canvas.getContext("2d") ??
    inlineThrow("Could not get context of tracker canvas");
  let lineWidth = 0;
  channel.on("canvasInfo", (info) => {
    canvas.height = info.height;
    canvas.width = info.width;
    context.scale(info.scaleFactor, info.scaleFactor);
    lineWidth = info.lineWidth;
  });
  const prevPositions: Record<string, { x: number; y: number }> = {};
  channel.on("positionData", (data) =>
    data.forEach((pos) => {
      const prevPos = prevPositions[pos.id];
      //if no fill or no previous position for id, only move pos
      if (!pos.fill || prevPos == null) {
        prevPositions[pos.id] = { x: pos.x, y: pos.y };
        return;
      }
      if (
        checkCollisions &&
        (pos.x < 0 ||
          pos.x > canvas.width ||
          pos.y < 0 ||
          pos.y > canvas.height ||
          context.getImageData(pos.x, pos.y, 1, 1).data[3] !== 0)
      ) {
        //Position is collision
        channel.send("reportCollision", pos.id);
      }
      //Draw new position
      context.beginPath();
      context.lineCap = "square";
      context.lineWidth = lineWidth;
      context.strokeStyle = pos.fill;
      context.moveTo(prevPos.x, prevPos.y);
      context.lineTo(pos.x, pos.y);
      context.stroke();
      context.closePath();
      prevPos.x = pos.x;
      prevPos.y = pos.y;
    })
  );
}
