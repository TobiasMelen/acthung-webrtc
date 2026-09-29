import createCollisionGrid, { GridHit, Point } from "./collisionGrid";
import test from "../test";

const LINE_WIDTH = 8;
const createGrid = () =>
  createCollisionGrid({
    width: 400,
    height: 400,
    lineWidth: LINE_WIDTH,
    holeLineWidth: LINE_WIDTH + 3,
  });

//Mirrors the per-frame record snakeGameContext's moveSnake produces.
function driveSnake(
  grid: ReturnType<typeof createGrid>,
  index: number,
  [startX, startY]: Point,
  startDirection: number,
  frames: number,
  { speed = 3.3, turn = 0, holeFrames = [] as number[] } = {},
) {
  let x = startX;
  let y = startY;
  let direction = startDirection;
  let erasePos: Point | null = null;
  const hits: GridHit[] = [];
  for (let frame = 0; frame < frames; frame++) {
    const probe: Point = [
      x + (speed + LINE_WIDTH / 2) * Math.cos(direction),
      y + (speed + LINE_WIDTH / 2) * Math.sin(direction),
    ];
    const erase = erasePos ? ([...erasePos, x, y] as const) : undefined;
    erasePos = holeFrames.includes(frame) ? [x, y] : null;
    direction += turn;
    const nextX = x + speed * Math.cos(direction);
    const nextY = y + speed * Math.sin(direction);
    hits.push(
      ...grid.processFrame([
        { index, probe, erase: erase && [...erase], line: [x, y, nextX, nextY] },
      ]),
    );
    x = nextX;
    y = nextY;
  }
  return hits;
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from }, (_, i) => from + i);

test("Snake does not collide with its own fresh trail", (assert) => {
  const grid = createGrid();
  assert(driveSnake(grid, 0, [50, 200], 0, 90).length === 0);
});

test("Snake turning at max rate does not collide with itself before looping", (assert) => {
  const grid = createGrid();
  assert(driveSnake(grid, 0, [200, 100], 0, 90, { turn: 0.05 }).length === 0);
});

test("Snake collides with its own trail after a full loop", (assert) => {
  const grid = createGrid();
  const hits = driveSnake(grid, 0, [200, 100], 0, 200, { turn: 0.05 });
  assert(hits.some((hit) => hit.hit === "collision" && hit.index === 0));
});

test("Snake collides with another snake's trail", (assert) => {
  const grid = createGrid();
  driveSnake(grid, 1, [200, 20], Math.PI / 2, 110);
  const hits = driveSnake(grid, 0, [50, 200], 0, 80);
  assert(hits[0]?.hit === "collision" && hits[0].index === 0);
});

test("Fast snake does not tunnel through a trail", (assert) => {
  //Sweep start offsets so some probes would land on either side of the trail.
  for (let offset = 0; offset < 13.2; offset += 0.5) {
    const grid = createGrid();
    driveSnake(grid, 1, [200, 20], Math.PI / 2, 110);
    const hits = driveSnake(grid, 0, [50 + offset, 200], 0, 20, { speed: 13.2 });
    assert(hits.some((hit) => hit.hit === "collision"));
  }
});

test("Snake passes through another snake's hole", (assert) => {
  const grid = createGrid();
  //Hole frames 50-60 cover y ≈ 185-218 on the vertical trail.
  driveSnake(grid, 1, [200, 20], Math.PI / 2, 110, { holeFrames: range(50, 61) });
  const hits = driveSnake(grid, 0, [50, 200], 0, 80);
  assert(hits.length > 0);
  assert(hits.every((hit) => hit.hit === "holePass"));
});

test("Snake does not register passes through its own fresh hole", (assert) => {
  const grid = createGrid();
  assert(
    driveSnake(grid, 0, [50, 200], 0, 90, { holeFrames: range(20, 40) }).length === 0,
  );
});
