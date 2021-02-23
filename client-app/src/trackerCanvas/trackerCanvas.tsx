/// <reference lib="WebWorker" />
import { BindableMessageChannel } from "../messaging/setupMessageChannel";
import { createWebWorkerMessageChannel } from "../messaging/webWorkerMessageChannel";
import { inlineThrow } from "../utility";
import {
  messagesFromTracker,
  messagesToTracker,
} from "./trackerCanvasMessaging";

type Point = { x: number; y: number };

function createTrackerCanvas(
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
  const prevPositions: Record<string, Point> = {};
  channel.on("positionData", (data) => {
    data.forEach((pos) => {
      const prevPos = prevPositions[pos.id];
      prevPositions[pos.id] = { x: pos.x, y: pos.y };
      const futurePos =
        prevPos != null &&
        !(prevPos.x === pos.x && prevPos.y === pos.y) &&
        getUpcomingPosition(prevPos, pos);
      if (
        checkCollisions &&
        (pos.x < 0 ||
          pos.x > canvas.width ||
          pos.y < 0 ||
          pos.y > canvas.height ||
          (futurePos &&
            context.getImageData(futurePos.x, futurePos.y, 1, 1).data[3] !== 0))
      ) {
        //Position is collision
        channel.send("reportCollision", pos.id);
      }
      if (!pos.fill || prevPos == null) {
        return;
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
    });
  });
}

const getUpcomingPosition = (prevPos: Point, currentPos: Point) => {
  const length = Math.sqrt(
    Math.pow(prevPos.x - currentPos.x, 2) +
      Math.pow(prevPos.y - currentPos.y, 2)
  );
  return {
    x: currentPos.x + ((currentPos.x - prevPos.x) / length) * 3,
    y: currentPos.y + ((currentPos.y - prevPos.y) / length) * 3,
  };
};

console.log("adding initial event listener");
self.addEventListener(
  "message",
  function initialMessageHandler(ev: MessageEvent) {
    const canvas =
      ev.data instanceof OffscreenCanvas
        ? ev.data
        : ev.data === "SELF_HOST_CANVAS"
        ? new OffscreenCanvas(0, 0)
        : inlineThrow(
            'Either transfer a OffScreenCanvas to worker or send string "SELF_HOSTED_CANVAS" as initial message to worker'
          );
    self.removeEventListener("message", initialMessageHandler);
    createTrackerCanvas(
      canvas,
      createWebWorkerMessageChannel(self as DedicatedWorkerGlobalScope),
      true
    );
  }
);
