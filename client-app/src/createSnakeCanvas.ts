export type SnakeInput = {
  color: string;
  onCollision: () => void;
};

export default function createSnakeCanvas(
  container: HTMLElement,
  snakeInputs: SnakeInput[],
  {
    snakeSpeed = 2,
    snakeRadius = 3.5,
    turnAngle = 0.045,
    startPositionSpread = 0.5,
    borderColor = "#fff",
    chanceToBecomeAHole = 0.01,
    holeDuration = 20
  } = {}
) {
  //Create scaled canvas for rendering
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  canvas.style.height = "100%";
  canvas.style.width = "100%";
  canvas.height = container.clientHeight;
  canvas.width = container.clientWidth;
  const context =
    canvas.getContext("2d") ??
    (() => {
      throw new Error("Could not get Snake canvas 2d context");
    })();
  const shortestAxis =
    canvas.height > canvas.width ? canvas.height : canvas.width;
  const scaleFactor = shortestAxis;
  // context.scale(canvas.width / scaleFactor, canvas.height / scaleFactor);

  //Draw border
  context.beginPath();
  context.strokeStyle = borderColor;
  const borderThickness = snakeRadius * 2;
  context.lineWidth = borderThickness;
  context.strokeRect(
    borderThickness / 2,
    borderThickness / 2,
    context.canvas.width - borderThickness,
    context.canvas.height - borderThickness
  );
  context.stroke();
  context.closePath();

  //Create stateful snake objects
  const snakes = snakeInputs.map(input => ({
    ...input,
    hasCollided: false,
    turn: 0,
    direction: Math.round(Math.random() * 360),
    position: {
      x:
      (Math.random() + startPositionSpread) *
      (context.canvas.width * startPositionSpread),
      y:
      (Math.random() + startPositionSpread) *
      (context.canvas.height * startPositionSpread)
    },
    currentHoleSection: 0,
    erasePath: null as null | {x: number, y: number},
  }));

  //function for colliding and drawing snake
  function moveSnake(snake: typeof snakes[0], checkCollision = true) {
    if (snake.hasCollided) {
      return;
    }

    const willCollide = checkCollision &&
      context.getImageData(
        snake.position.x + (snakeRadius + snakeSpeed) * Math.cos(snake.direction),
        snake.position.y + (snakeRadius + snakeSpeed) * Math.sin(snake.direction),
        1,
        1
      ).data[3] !== 0;
    if (willCollide) {
      snake.onCollision();
      snake.hasCollided = true;
    }
    
    context.beginPath();
    context.lineCap = "square";
    context.lineWidth = snakeRadius * 2;
    context.moveTo(snake.position.x, snake.position.y);
    snake.direction += snake.turn * turnAngle;
    snake.position.x += snakeSpeed * Math.cos(snake.direction);
    snake.position.y += snakeSpeed * Math.sin(snake.direction);
    context.strokeStyle = snake.color;
    context.lineTo(snake.position.x, snake.position.y);
    context.stroke();
    context.closePath();
  }

  let stopped = true;
  function run() {
    let checkCollision = true;
    function drawFrame() {
      for (const snake of snakes) {
        moveSnake(snake, checkCollision);
      }
      checkCollision = !checkCollision;
      !stopped && requestAnimationFrame(drawFrame);
    }
    if (stopped) {
      requestAnimationFrame(drawFrame);
      stopped = false;
    }
  }

  return {
    run,
    stop() {
      stopped = true;
    },
    snakeTurners: snakes.map(snake => (turn: number) => {
      const newTurn = snake.turn + turn;
      if (Math.abs(newTurn) <= 1) {
        snake.turn = newTurn;
      }
    })
  };
}
