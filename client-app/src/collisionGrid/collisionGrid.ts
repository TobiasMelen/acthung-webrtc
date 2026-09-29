export type GridConfig = {
  width: number;
  height: number;
  lineWidth: number;
  holeLineWidth: number;
};

export type Point = [x: number, y: number];
export type Line = [x0: number, y0: number, x1: number, y1: number];

export type SnakeFrame = {
  index: number;
  probe: Point;
  erase?: Line;
  line: Line;
};

export type GridHit = { index: number; hit: "collision" | "holePass" };

const CELL_SIZE = 2;
const EMPTY = 0;
const TRAIL = 1;
const HOLE = 2;
//A snake's own cells younger than this are ignored, otherwise the probe hits the trail right behind the head.
const SELF_GRACE_TICKS = 10;

/*
 * Occupancy grid mirroring what snakeGameContext draws, so collisions can be checked without reading canvas pixels.
 * Frames must be fed in the same order as the canvas draws them: probe, then erase, then line.
 */
export default function createCollisionGrid({
  width,
  height,
  lineWidth,
  holeLineWidth,
}: GridConfig) {
  const cols = Math.ceil(width / CELL_SIZE);
  const rows = Math.ceil(height / CELL_SIZE);
  const kinds = new Uint8Array(cols * rows);
  const owners = new Uint8Array(cols * rows);
  const ticks = new Uint32Array(cols * rows);
  const lastProbes = new Map<number, Point>();
  let tick = 0;

  function stampDisc(x: number, y: number, radius: number, kind: number, owner: number) {
    const cellRadius = Math.ceil(radius / CELL_SIZE);
    const cx = Math.floor(x / CELL_SIZE);
    const cy = Math.floor(y / CELL_SIZE);
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      const gy = cy + dy;
      if (gy < 0 || gy >= rows) continue;
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const gx = cx + dx;
        if (gx < 0 || gx >= cols || dx * dx + dy * dy > cellRadius * cellRadius) continue;
        const index = gy * cols + gx;
        kinds[index] = kind;
        owners[index] = owner;
        ticks[index] = tick;
      }
    }
  }

  function stampLine([x0, y0, x1, y1]: Line, radius: number, kind: number, owner: number) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / CELL_SIZE));
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      stampDisc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, kind, owner);
    }
  }

  //Samples every cell between the previous and current probe so fast snakes can't skip over lines.
  function probeLine(owner: number, [x0, y0]: Point, [x1, y1]: Point) {
    let hitHole = false;
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / CELL_SIZE));
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const gx = Math.floor((x0 + (x1 - x0) * t) / CELL_SIZE);
      const gy = Math.floor((y0 + (y1 - y0) * t) / CELL_SIZE);
      if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
      const index = gy * cols + gx;
      if (kinds[index] === EMPTY) continue;
      if (owners[index] === owner && tick - ticks[index] <= SELF_GRACE_TICKS) continue;
      if (kinds[index] === TRAIL) return "collision" as const;
      hitHole = true;
    }
    return hitHole ? ("holePass" as const) : undefined;
  }

  return {
    processFrame(frame: SnakeFrame[]) {
      tick++;
      const hits: GridHit[] = [];
      for (const snake of frame) {
        const hit = probeLine(
          snake.index,
          lastProbes.get(snake.index) ?? snake.probe,
          snake.probe,
        );
        lastProbes.set(snake.index, snake.probe);
        if (hit) {
          hits.push({ index: snake.index, hit });
        }
        if (snake.erase) {
          stampLine(snake.erase, holeLineWidth / 2, HOLE, snake.index);
        }
        stampLine(snake.line, lineWidth / 2, TRAIL, snake.index);
      }
      return hits;
    },
  };
}
