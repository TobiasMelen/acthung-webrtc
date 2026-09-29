import { Converter, MessageChannel } from "../messaging/setupMessageChannel";
import { jsonConverter, numberConverter } from "../messaging/valueConverters";
import type { GridConfig, SnakeFrame } from "./collisionGrid";

export const messagesToCollisionGrid = {
  init: jsonConverter as Converter<GridConfig>,
  frame: jsonConverter as Converter<SnakeFrame[]>,
};
export const messagesFromCollisionGrid = {
  collision: numberConverter,
  holePass: numberConverter,
};

export type CollisionGridMessageChannel = MessageChannel<
  typeof messagesToCollisionGrid,
  typeof messagesFromCollisionGrid
>;
