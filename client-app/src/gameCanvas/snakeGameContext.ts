import { inlineThrow } from "../utility";
import {
  messagesFromTracker,
  messagesToTracker,
  TrackerMessageChannel,
} from "../collisionCanvas/collisionCanvasMessaging";
import CollisionTrackerWorker from "../collisionCanvas/collisionCanvas?worker";
import CollisionGridWorker from "../collisionGrid/collisionGridWorker?worker";
import {
  messagesFromCollisionGrid,
  messagesToCollisionGrid,
} from "../collisionGrid/collisionGridMessaging";
import type { SnakeFrame } from "../collisionGrid/collisionGrid";
import { createWebWorkerMessageChannel } from "../messaging/webWorkerMessageChannel";

export type SnakeInput = {
  id: string;
  color: string;
  onCollision: () => void;
  onHolePass: () => void;
};

const frameTimeSixtyFps = 1000 / 60;

export type GameInput = Parameters<typeof snakeGameContext>[1];

export default function snakeGameContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  {
    snakeSpeed = 3.3,
    lineWidth = 8,
    turnRadius = 0.05,
    startPositionSpread = 0.5,
    startingHoleChancePercantage = -3,
    holeChanceVariance = 4,
    holeChanceIncrement = 0.04,
    holeDuration = 5,
    holeDurationVariance = 20,
    worldHeight = canvas.height,
    checkCollisions = true,
    useTrackingCollisionCanvas = false,
  } = {},
) {
  //Never read pixels back from this context, it would force the GPU canvas into slow readbacks.
  const context =
    (canvas.getContext("2d", {
      desynchronized: true,
    }) as OffscreenCanvasRenderingContext2D) ??
    inlineThrow("Could not get Snake canvas 2d context");
  const holeLineWidth = lineWidth + 3;
  //Snakes move in world units, the canvas may have fewer or more pixels than that.
  const scaleFactor = canvas.height / worldHeight;
  const world = { width: canvas.width / scaleFactor, height: worldHeight };
  context.scale(scaleFactor, scaleFactor);

  const createNewSnake = (input: SnakeInput) => ({
    ...input,
    hasCollided: false,
    turn: 0,
    direction: Math.round(Math.random() * 360),
    holeChance:
      startingHoleChancePercantage + Math.random() * holeChanceVariance,
    position: {
      x:
        (Math.random() + startPositionSpread) *
        (world.width * startPositionSpread),
      y:
        (Math.random() + startPositionSpread) *
        (world.height * startPositionSpread),
    },
    currentHoleSection: 0,
    erasePos: null as null | { x: number; y: number },
    holePassCooldown: 0,
  });

  const snakes: (ReturnType<typeof createNewSnake> & SnakeInput)[] = [];

  //Create or update snake and return turntrigger
  const inputSnakeData = (input: SnakeInput) => {
    let snake = snakes.find((snake) => snake.id === input.id);
    if (snake == null) {
      snake = createNewSnake(input);
      snakes.push(snake);
    }
    return (turn: number) => {
      snake!.turn = turn;
    };
  };

  function drawTriangle(snake: (typeof snakes)[0], size = lineWidth) {
    const { x, y } = snake.position;
    const angle = snake.direction;
    context.beginPath();
    context.moveTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    context.lineTo(
      x + size * Math.cos(angle + 2.4),
      y + size * Math.sin(angle + 2.4),
    );
    context.lineTo(
      x + size * Math.cos(angle - 2.4),
      y + size * Math.sin(angle - 2.4),
    );
    context.closePath();
    context.fillStyle = snake.color;
    context.fill();
  }

  function collide(snake: (typeof snakes)[0]) {
    if (!snake.hasCollided) {
      snake.hasCollided = true;
      snake.onCollision();
    }
  }

  function passHole(snake: (typeof snakes)[0]) {
    if (!snake.hasCollided && snake.holePassCooldown <= 0) {
      snake.holePassCooldown = 10;
      snake.onHolePass();
    }
  }

  //Draws the snake's next step and returns what was drawn for the collision grid.
  function moveSnake(
    snake: (typeof snakes)[0],
    index: number,
    snakeSpeed: number,
    turnAngle: number,
    frameTimeOffset: number,
  ): SnakeFrame | undefined {
    if (snake.hasCollided) {
      return;
    }
    if (snake.currentHoleSection <= 0) {
      //Durations and chances are per 60fps frame, scale them by elapsed time.
      if (
        snake.holeChance > 0 &&
        Math.random() * 100 < snake.holeChance * frameTimeOffset
      ) {
        snake.currentHoleSection =
          holeDuration + Math.floor(Math.random() * holeDurationVariance);
        snake.holeChance =
          startingHoleChancePercantage + Math.random() * holeChanceVariance;
      } else {
        snake.holeChance += holeChanceIncrement * frameTimeOffset;
      }
    }

    if (snake.holePassCooldown > 0) {
      snake.holePassCooldown -= frameTimeOffset;
    }

    if (
      checkCollisions &&
      (snake.position.x < 0 ||
        snake.position.x > world.width ||
        snake.position.y < 0 ||
        snake.position.y > world.height)
    ) {
      collide(snake);
    }

    const { x, y } = snake.position;
    const probe: SnakeFrame["probe"] = [
      x + (snakeSpeed + lineWidth / 2) * Math.cos(snake.direction),
      y + (snakeSpeed + lineWidth / 2) * Math.sin(snake.direction),
    ];
    const erase: SnakeFrame["erase"] =
      snake.erasePos != null
        ? [snake.erasePos.x, snake.erasePos.y, x, y]
        : undefined;

    if (snake.erasePos != null) {
      context.beginPath();
      context.lineCap = "square";
      context.lineWidth = holeLineWidth;
      context.strokeStyle = "#000000";
      context.moveTo(snake.erasePos.x, snake.erasePos.y);
      context.lineTo(snake.position.x, snake.position.y);
      context.stroke();
      context.closePath();
      snake.erasePos = null;
    }

    if (snake.currentHoleSection > 0) {
      snake.erasePos = { ...snake.position };
      snake.currentHoleSection -= frameTimeOffset;
    }

    context.beginPath();
    context.lineCap = "square";
    context.lineWidth = lineWidth;
    context.strokeStyle = snake.color;
    context.moveTo(snake.position.x, snake.position.y);
    snake.direction += snake.turn * turnAngle;
    snake.position.x += snakeSpeed * Math.cos(snake.direction);
    snake.position.y += snakeSpeed * Math.sin(snake.direction);
    context.lineTo(snake.position.x, snake.position.y);
    context.stroke();
    context.closePath();

    return {
      index,
      probe,
      erase,
      line: [x, y, snake.position.x, snake.position.y],
    };
  }

  //Setup tracker canvases
  const trackers: {
    channel: TrackerMessageChannel;
    interval: number;
    latestReport: number;
  }[] = [];
  function addTrackingChannel(
    channel: TrackerMessageChannel,
    interval: number,
    //Collision reporting needs to be guarded from this side to disable hacking attempts.
    reportsCollisions: boolean,
  ) {
    channel.send("canvasInfo", {
      width: canvas.width,
      height: canvas.height,
      scaleFactor,
      lineWidth,
    });
    trackers.push({ interval, channel, latestReport: 0 });
    reportsCollisions &&
      channel.on("reportCollision", (id) => {
        const snake = snakes.find((snake) => snake.id === id);
        if (snake) {
          collide(snake);
        }
      });
  }

  //Spawned per round so every round starts with an empty grid.
  function startCollisionGrid() {
    const worker = new CollisionGridWorker();
    const channel = createWebWorkerMessageChannel(worker)(
      messagesToCollisionGrid,
      messagesFromCollisionGrid,
    );
    channel.send("init", {
      width: world.width,
      height: world.height,
      lineWidth,
      holeLineWidth,
    });
    channel.on("collision", (index) => snakes[index] && collide(snakes[index]));
    channel.on("holePass", (index) => snakes[index] && passHole(snakes[index]));
    return {
      sendFrame: (frame: SnakeFrame[]) => channel.send("frame", frame),
      terminate() {
        channel.destroy();
        worker.terminate();
      },
    };
  }

  //Create collision canvas
  const collisionCanvasWorker =
    useTrackingCollisionCanvas &&
    (() => {
      const collisionCanvasWorker = new CollisionTrackerWorker();
      collisionCanvasWorker.postMessage("SELF_HOST_CANVAS");
      const collisionTracker = createWebWorkerMessageChannel(
        collisionCanvasWorker,
      )(messagesToTracker, messagesFromTracker);
      addTrackingChannel(collisionTracker, 50, true);
      return collisionCanvasWorker;
    })();

  let activeAbort: AbortController | null = null;

  function clearCanvas() {
    context.clearRect(0, 0, world.width, world.height);
  }

  function showStartSequence(signal: AbortSignal) {
    if (snakes.length === 0) return Promise.resolve();

    const staggerInterval = 1000;
    const blinkToggle = staggerInterval / 3;
    let startTime: number | null = null;

    return new Promise<void>((resolve) => {
      function frame(now: number) {
        if (signal.aborted) return resolve();

        // Initialize start time on first frame to avoid negative elapsed
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;

        clearCanvas();

        let allVisible = true;
        for (let i = 0; i < snakes.length; i++) {
          const snake = snakes[i];
          const snakeStartTime = i * staggerInterval;
          const timeSinceStart = elapsed - snakeStartTime;

          if (timeSinceStart < 0) {
            // Not yet time for this snake
            allVisible = false;
          } else if (timeSinceStart < staggerInterval) {
            // Blinking phase
            allVisible = false;
            const blinkOn = Math.floor(timeSinceStart / blinkToggle) % 2 === 0;
            if (blinkOn) drawTriangle(snake);
          } else {
            // Fully visible
            drawTriangle(snake);
          }
        }

        if (allVisible) {
          clearCanvas();
          return resolve();
        }

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function startGameLoop(
    signal: AbortSignal,
    collisionGrid: ReturnType<typeof startCollisionGrid> | null,
  ) {
    let timeStamp = performance.now();
    function drawFrame(now: number) {
      if (signal.aborted) return;
      const frameTimeActual = now - timeStamp;
      let frameTimeOffset = frameTimeActual / frameTimeSixtyFps;
      //Don't skip too far if we're lagging.
      frameTimeOffset = frameTimeOffset < 4 ? frameTimeOffset : 4;
      const frameTimeSnakeSpeed = snakeSpeed * frameTimeOffset;
      const frameTimeTurnRadius = turnRadius * frameTimeOffset;
      timeStamp = now;
      const collisionFrame: SnakeFrame[] = [];
      for (let index = 0; index < snakes.length; index++) {
        const snakeFrame = moveSnake(
          snakes[index],
          index,
          frameTimeSnakeSpeed,
          frameTimeTurnRadius,
          frameTimeOffset,
        );
        snakeFrame && collisionFrame.push(snakeFrame);
      }
      collisionGrid?.sendFrame(collisionFrame);

      for (const tracker of trackers) {
        let positionData = null;
        if (now - tracker.latestReport >= tracker.interval) {
          positionData ??= snakes
            .filter((snake) => !snake.hasCollided)
            .map((snake) => ({
              id: snake.id,
              fill: snake.currentHoleSection ? undefined : snake.color,
              x: snake.position.x,
              y: snake.position.y,
            }));
          tracker.channel.send("positionData", positionData);
        }
      }
      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  }

  function run() {
    stop();
    const abort = new AbortController();
    activeAbort = abort;
    const collisionGrid = checkCollisions ? startCollisionGrid() : null;
    abort.signal.addEventListener("abort", () => collisionGrid?.terminate());
    showStartSequence(abort.signal).then(() => {
      if (!abort.signal.aborted) {
        startGameLoop(abort.signal, collisionGrid);
      }
    });
  }

  function stop() {
    activeAbort?.abort();
    activeAbort = null;
  }

  return {
    run,
    stop,
    inputSnakeData,
    addTrackingChannel,
    destroy() {
      collisionCanvasWorker && collisionCanvasWorker.terminate();
      stop();
    },
  };
}
