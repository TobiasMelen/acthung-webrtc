import { inlineThrow } from "../utility";
import {
  messagesFromTracker,
  messagesToTracker,
  TrackerMessageChannel,
} from "../collisionCanvas/collisionCanvasMessaging";
import CollisionTrackerWorker from "../collisionCanvas/collisionCanvas?worker";
import { createWebWorkerMessageChannel } from "../messaging/webWorkerMessageChannel";

export type SnakeInput = {
  id: string;
  color: string;
  onCollision: () => void;
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
    holeChanceIncrement = 0.02,
    holeDuration = 20,
    holeDurationVariance = 10,
    maxVerticalResolution = 1080,
    checkCollisions = true,
    useTrackingCollisionCanvas = false,
  } = {}
) {
  const context =
    (canvas.getContext("2d", {
      desynchronized: true,
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D) ??
    inlineThrow("Could not get Snake canvas 2d context");
  const scaleFactor =
    canvas.height > maxVerticalResolution
      ? canvas.height / maxVerticalResolution
      : 1;
  context.scale(scaleFactor, scaleFactor);

  const createNewSnake = (input: SnakeInput) => ({
    ...input,
    hasCollided: false,
    turn: 0,
    direction: Math.round(Math.random() * 360),
    holeChance: startingHoleChancePercantage + Math.random() * holeChanceVariance,
    position: {
      x:
        (Math.random() + startPositionSpread) *
        (context.canvas.width * startPositionSpread),
      y:
        (Math.random() + startPositionSpread) *
        (context.canvas.height * startPositionSpread),
    },
    currentHoleSection: 0,
    erasePos: null as null | { x: number; y: number },
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

  function drawTriangle(snake: typeof snakes[0], size = lineWidth) {
    const { x, y } = snake.position;
    const angle = snake.direction;
    context.beginPath();
    context.moveTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    context.lineTo(
      x + size * Math.cos(angle + 2.4),
      y + size * Math.sin(angle + 2.4)
    );
    context.lineTo(
      x + size * Math.cos(angle - 2.4),
      y + size * Math.sin(angle - 2.4)
    );
    context.closePath();
    context.fillStyle = snake.color;
    context.fill();
  }

  //function for colliding and drawing snake
  function moveSnake(
    snake: typeof snakes[0],
    snakeSpeed: number,
    turnAngle: number,
    checkCollision = false
  ) {
    if (snake.hasCollided) {
      return;
    }
    if (snake.currentHoleSection == 0) {
      if (snake.holeChance > 0 && Math.random() * 100 < snake.holeChance) {
        snake.currentHoleSection =
          holeDuration + Math.floor(Math.random() * holeDurationVariance);
        snake.holeChance =
          startingHoleChancePercantage + Math.random() * holeChanceVariance;
      } else {
        snake.holeChance = snake.holeChance + holeChanceIncrement;
      }
    }

    const willCollide =
      checkCollision &&
      (snake.position.x < 0 ||
        snake.position.x > canvas.width ||
        snake.position.y < 0 ||
        snake.position.y > canvas.height ||
        context.getImageData(
          snake.position.x +
            (snakeSpeed + lineWidth / 2) * Math.cos(snake.direction),
          snake.position.y +
            (snakeSpeed + lineWidth / 2) * Math.sin(snake.direction),
          1,
          1
        ).data[3] !== 0);

    if (willCollide) {
      snake.hasCollided = true;
      snake.onCollision();
    }

    if (snake.erasePos != null) {
      context.beginPath();
      context.lineCap = "square";
      context.lineWidth = lineWidth + 3;
      const prevCompOp = context.globalCompositeOperation;
      context.globalCompositeOperation = "destination-out";
      context.moveTo(snake.erasePos.x, snake.erasePos.y);
      context.lineTo(snake.position.x, snake.position.y);
      context.stroke();
      context.closePath();
      snake.erasePos = null;
      context.globalCompositeOperation = prevCompOp;
    }

    if (snake.currentHoleSection > 0) {
      snake.erasePos = { ...snake.position };
      snake.currentHoleSection--;
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
    reportsCollisions: boolean
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
          snake.hasCollided = true;
          snake.onCollision();
        }
      });
  }

  //Create collision canvas
  const collisionCanvasWorker =
    useTrackingCollisionCanvas &&
    (() => {
      const collisionCanvasWorker = new CollisionTrackerWorker();
      collisionCanvasWorker.postMessage("SELF_HOST_CANVAS");
      const collisionTracker = createWebWorkerMessageChannel(
        collisionCanvasWorker
      )(messagesToTracker, messagesFromTracker);
      addTrackingChannel(collisionTracker, 50, true);
      return collisionCanvasWorker;
    })();

  let activeAbort: AbortController | null = null;

  function clearCanvas() {
    context.clearRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
  }

  function showStartSequence(signal: AbortSignal) {
    const staggerInterval = 1000;
    const blinkToggle = staggerInterval / 3;
    const totalDuration = snakes.length * staggerInterval;
    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      function frame(now: number) {
        if (signal.aborted) return resolve();
        const elapsed = now - startTime;

        if (elapsed >= totalDuration) {
          clearCanvas();
          return resolve();
        }

        clearCanvas();
        const activeIndex = Math.floor(elapsed / staggerInterval);

        for (let i = 0; i < activeIndex; i++) {
          drawTriangle(snakes[i]);
        }

        const timeInWindow = elapsed - activeIndex * staggerInterval;
        const blinkOn = Math.floor(timeInWindow / blinkToggle) % 2 === 0;
        if (blinkOn) {
          drawTriangle(snakes[activeIndex]);
        }

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  function startGameLoop(signal: AbortSignal) {
    let timeStamp = performance.now();
    let collisionCheckOdd = false;
    function drawFrame(now: number) {
      if (signal.aborted) return;
      const frameTimeActual = now - timeStamp;
      let frameTimeOffset = frameTimeActual / frameTimeSixtyFps;
      //Don't skip too far if we're lagging.
      frameTimeOffset = frameTimeOffset < 4 ? frameTimeOffset : 4;
      const frameTimeSnakeSpeed = snakeSpeed * frameTimeOffset;
      const frameTimeTurnRadius = turnRadius * frameTimeOffset;
      timeStamp = now;
      for (let index = 0; index < snakes.length; index++) {
        moveSnake(
          snakes[index],
          frameTimeSnakeSpeed,
          frameTimeTurnRadius,
          checkCollisions && !!(index % 2) === collisionCheckOdd
        );
      }
      collisionCheckOdd = !collisionCheckOdd;

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

  async function run() {
    stop();
    const abort = new AbortController();
    activeAbort = abort;
    await showStartSequence(abort.signal);
    if (!abort.signal.aborted) startGameLoop(abort.signal);
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
