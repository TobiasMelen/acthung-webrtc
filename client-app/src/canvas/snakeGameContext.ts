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
    startingHoleChancePercantage = -5,
    holeDuration = 10,
    maxVerticalResolution = 1080,
  } = {}
) {
  {
    const context =
      canvas.getContext("2d", {desynchronized
        : true, willReadFrequently: true}) as OffscreenCanvasRenderingContext2D ??
      (() => {
        throw new Error("Could not get Snake canvas 2d context");
      })();
    if (canvas.height > maxVerticalResolution) {
      const scaleFactor = canvas.height / maxVerticalResolution;
      context.scale(scaleFactor, scaleFactor);
    }
    // context.globalCompositeOperation = "destination-over";

    const createNewSnake = () => ({
      hasCollided: false,
      turn: 0,
      direction: Math.round(Math.random() * 360),
      holeChance: startingHoleChancePercantage,
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
      let index =
        snakes.findIndex((snake) => snake.id === input.id) ?? snakes.length;
      const snake = { ...(snakes[index] ?? createNewSnake()), ...input };
      snakes[index >= 0 ? index : 0] = snake;
      return (turn: number) => {
        snake.turn = turn;
      };
    };

    //function for colliding and drawing snake
    function moveSnake(
      snake: typeof snakes[0],
      snakeSpeed: number,
      turnAngle: number,
      checkCollision = true
    ) {
      if (snake.hasCollided) {
        return;
      }
      if (snake.currentHoleSection == 0) {
        if (snake.holeChance > 0 && Math.random() * 100 < snake.holeChance) {
          snake.currentHoleSection = holeDuration;
          snake.holeChance = startingHoleChancePercantage;
        } else {
          snake.holeChance = snake.holeChance + 0.1;
        }
      }

      const willCollide =
        checkCollision &&
        (snake.position.x < 0 ||
          snake.position.x > canvas.width ||
          snake.position.y < 0 ||
          snake.position.y > canvas.height);
        //   context.getImageData(
        //     snake.position.x +
        //       (snakeSpeed + lineWidth / 2) * Math.cos(snake.direction),
        //     snake.position.y +
        //       (snakeSpeed + lineWidth / 2) * Math.sin(snake.direction),
        //     1,
        //     1
        //   ).data[3] !== 0
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

    let stopped = true;
    function run() {
      let checkCollision = true;
      let timeStamp = performance.now();
      function drawFrame(now: number) {
        const frameTimeActual = now - timeStamp;
        let frameTimeOffset = frameTimeActual / frameTimeSixtyFps;
        //Don't skip too far if we're lagging.
        frameTimeOffset = frameTimeOffset < 4 ? frameTimeOffset : 4;
        const frameTimeSnakeSpeed = snakeSpeed * frameTimeOffset;
        const frameTimeTurnRadius = turnRadius * frameTimeOffset;
        timeStamp = now;
        for (const snake of snakes) {
          moveSnake(
            snake,
            frameTimeSnakeSpeed,
            frameTimeTurnRadius,
            checkCollision
          );
        }
        checkCollision = !checkCollision;
        !stopped && requestAnimationFrame(drawFrame);
      }
      if (stopped) {
        stopped = false;
        requestAnimationFrame(drawFrame);
      }
    }
    function stop() {
      stopped = true;
    }

    return {
      run,
      stop,
      inputSnakeData,
      destroy() {
        stop();
      },
    };
  }
}
