import {
  BALL_MAX_ANGLE,
  BALL_SIZE,
  BALL_SPEED_INCREMENT,
  BALL_SPEED_MAX,
  BALL_SPEED_START,
  BRICK_COLS,
  BRICK_OFFSET_LEFT,
  BRICK_OFFSET_TOP,
  BRICK_PADDING,
  BRICK_ROWS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COMBO_BONUS,
  COMBO_WINDOW_MS,
  LEVEL_CLEAR_BONUS,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_Y_OFFSET,
  SCORE_STANDARD,
  SCORE_STRONG_DESTROY,
  SCORE_STRONG_HIT,
  START_LIVES,
  WALL_THICKNESS,
} from './constants';
import { getLevel } from './breakoutLevels';
import type { Ball, Brick, BrickCell, BrickType, Paddle, Particle } from './types';

export function brickDimensions() {
  const innerWidth = CANVAS_WIDTH - BRICK_OFFSET_LEFT * 2;
  const width =
    (innerWidth - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;
  const height = 18;
  return { width, height };
}

export function createPaddle(): Paddle {
  return {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: CANVAS_HEIGHT - PADDLE_Y_OFFSET,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  };
}

export function createBallOnPaddle(paddle: Paddle, speed = BALL_SPEED_START): Ball {
  return {
    x: paddle.x + paddle.width / 2 - BALL_SIZE / 2,
    y: paddle.y - BALL_SIZE - 2,
    size: BALL_SIZE,
    vx: 0,
    vy: 0,
    speed,
    launched: false,
  };
}

export function createBricksFromLayout(layout: BrickCell[][]): Brick[] {
  const { width, height } = brickDimensions();
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const cell = layout[row]?.[col] ?? 0;
      if (cell === 0) continue;
      const type = cell as BrickType;
      bricks.push({
        id: `${row}-${col}`,
        col,
        row,
        x: BRICK_OFFSET_LEFT + col * (width + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (height + BRICK_PADDING),
        width,
        height,
        type,
        hits: 0,
        alive: true,
        flashUntil: 0,
      });
    }
  }
  return bricks;
}

export function loadLevelBricks(levelIndex: number): Brick[] {
  const level = getLevel(levelIndex);
  return createBricksFromLayout(level.layout);
}

export function clampPaddleX(paddle: Paddle, x: number): number {
  const min = WALL_THICKNESS;
  const max = CANVAS_WIDTH - WALL_THICKNESS - paddle.width;
  return Math.max(min, Math.min(max, x));
}

export function movePaddle(paddle: Paddle, targetX: number): void {
  paddle.x = clampPaddleX(paddle, targetX);
}

export function clampDeltaMs(dtMs: number): number {
  return Math.min(dtMs, 50) / 1000;
}

export function launchBall(ball: Ball, paddle: Paddle): void {
  if (ball.launched) return;
  ball.launched = true;
  ball.x = paddle.x + paddle.width / 2 - ball.size / 2;
  ball.y = paddle.y - ball.size - 2;
  ball.vx = 0;
  ball.vy = -ball.speed;
  stabilizeBallVelocity(ball);
}

/** Verhindert zu flache oder zu steile Bahnen. */
export function stabilizeBallVelocity(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy) || ball.speed;
  ball.speed = Math.min(speed, BALL_SPEED_MAX);

  const minVy = ball.speed * 0.25;
  const maxVy = ball.speed * 0.92;

  if (Math.abs(ball.vy) < minVy) {
    ball.vy = (ball.vy === 0 ? -1 : Math.sign(ball.vy)) * minVy;
  } else if (Math.abs(ball.vy) > maxVy) {
    ball.vy = Math.sign(ball.vy) * maxVy;
  }

  const vxMag = Math.sqrt(Math.max(0, ball.speed * ball.speed - ball.vy * ball.vy));
  ball.vx = Math.sign(ball.vx || (Math.random() < 0.5 ? -1 : 1)) * vxMag;
}

export function reflectPaddleHit(ball: Ball, paddle: Paddle): void {
  const hitPos = (ball.x + ball.size / 2 - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  const clamped = Math.max(-1, Math.min(1, hitPos));
  const angle = clamped * BALL_MAX_ANGLE;
  ball.speed = Math.min(ball.speed + BALL_SPEED_INCREMENT, BALL_SPEED_MAX);
  ball.vx = Math.sin(angle) * ball.speed;
  ball.vy = -Math.abs(Math.cos(angle) * ball.speed);
  ball.y = paddle.y - ball.size - 0.5;
  stabilizeBallVelocity(ball);
}

export interface WallHit {
  type: 'left' | 'right' | 'top' | 'bottom';
}

export function resolveWallCollision(ball: Ball): WallHit | null {
  const left = WALL_THICKNESS;
  const right = CANVAS_WIDTH - WALL_THICKNESS;
  const top = WALL_THICKNESS;

  if (ball.x <= left) {
    ball.x = left;
    ball.vx = Math.abs(ball.vx);
    stabilizeBallVelocity(ball);
    return { type: 'left' };
  }
  if (ball.x + ball.size >= right) {
    ball.x = right - ball.size;
    ball.vx = -Math.abs(ball.vx);
    stabilizeBallVelocity(ball);
    return { type: 'right' };
  }
  if (ball.y <= top) {
    ball.y = top;
    ball.vy = Math.abs(ball.vy);
    stabilizeBallVelocity(ball);
    return { type: 'top' };
  }
  if (ball.y + ball.size >= CANVAS_HEIGHT) {
    return { type: 'bottom' };
  }
  return null;
}

export interface BrickHitResult {
  brick: Brick;
  destroyed: boolean;
  score: number;
  side: 'horizontal' | 'vertical';
}

function circleRectOverlap(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function resolveBrickCollision(ball: Ball, bricks: Brick[]): BrickHitResult | null {
  const cx = ball.x + ball.size / 2;
  const cy = ball.y + ball.size / 2;
  const radius = ball.size / 2;

  for (const brick of bricks) {
    if (!brick.alive) continue;
    if (!circleRectOverlap(cx, cy, radius, brick.x, brick.y, brick.width, brick.height)) {
      continue;
    }

    const overlapLeft = cx + radius - brick.x;
    const overlapRight = brick.x + brick.width - (cx - radius);
    const overlapTop = cy + radius - brick.y;
    const overlapBottom = brick.y + brick.height - (cy - radius);
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    const side: 'horizontal' | 'vertical' =
      minOverlapX < minOverlapY ? 'horizontal' : 'vertical';

    if (side === 'horizontal') {
      ball.vx = -ball.vx;
      ball.x += ball.vx > 0 ? minOverlapX + 0.5 : -(minOverlapX + 0.5);
    } else {
      ball.vy = -ball.vy;
      ball.y += ball.vy > 0 ? minOverlapY + 0.5 : -(minOverlapY + 0.5);
    }
    stabilizeBallVelocity(ball);

    brick.flashUntil = performance.now() + 120;

    if (brick.type === 3) {
      return { brick, destroyed: false, score: 0, side };
    }

    if (brick.type === 2 && brick.hits === 0) {
      brick.hits = 1;
      return { brick, destroyed: false, score: SCORE_STRONG_HIT, side };
    }

    brick.alive = false;
    const score =
      brick.type === 2 ? SCORE_STRONG_DESTROY : SCORE_STANDARD;
    return { brick, destroyed: true, score, side };
  }
  return null;
}

export function resolvePaddleCollision(ball: Ball, paddle: Paddle): boolean {
  if (ball.vy <= 0) return false;
  const cx = ball.x + ball.size / 2;
  const cy = ball.y + ball.size / 2;
  const radius = ball.size / 2;
  if (
    circleRectOverlap(cx, cy, radius, paddle.x, paddle.y, paddle.width, paddle.height)
  ) {
    reflectPaddleHit(ball, paddle);
    return true;
  }
  return false;
}

export function stepBall(
  ball: Ball,
  paddle: Paddle,
  bricks: Brick[],
  dt: number,
): {
  wallHit: WallHit | null;
  paddleHit: boolean;
  brickHit: BrickHitResult | null;
  ballLost: boolean;
} {
  if (!ball.launched) {
    ball.x = paddle.x + paddle.width / 2 - ball.size / 2;
    ball.y = paddle.y - ball.size - 2;
    return { wallHit: null, paddleHit: false, brickHit: null, ballLost: false };
  }

  const steps = Math.max(1, Math.ceil((Math.hypot(ball.vx, ball.vy) * dt) / (ball.size * 0.5)));
  const subDt = dt / steps;
  let wallHit: WallHit | null = null;
  let paddleHit = false;
  let brickHit: BrickHitResult | null = null;

  for (let i = 0; i < steps; i++) {
    ball.x += ball.vx * subDt;
    ball.y += ball.vy * subDt;

    const wall = resolveWallCollision(ball);
    if (wall?.type === 'bottom') {
      return { wallHit: wall, paddleHit, brickHit, ballLost: true };
    }
    if (wall) wallHit = wall;

    if (resolvePaddleCollision(ball, paddle)) {
      paddleHit = true;
    }

    const hit = resolveBrickCollision(ball, bricks);
    if (hit) brickHit = hit;
  }

  return { wallHit, paddleHit, brickHit, ballLost: false };
}

export function isLevelComplete(bricks: Brick[]): boolean {
  return !bricks.some((b) => b.alive && b.type !== 3);
}

export function destroyableBrickCount(bricks: Brick[]): number {
  return bricks.filter((b) => b.alive && b.type !== 3).length;
}

export function applyComboScore(baseScore: number, combo: number, lastHitTime: number, now: number): {
  score: number;
  combo: number;
} {
  if (baseScore <= 0) return { score: 0, combo };
  const nextCombo = now - lastHitTime <= COMBO_WINDOW_MS ? combo + 1 : 1;
  const bonus = nextCombo > 1 ? COMBO_BONUS * (nextCombo - 1) : 0;
  return { score: baseScore + bonus, combo: nextCombo };
}

export function levelClearBonus(levelIndex: number): number {
  return LEVEL_CLEAR_BONUS + levelIndex * 50;
}

export function createParticles(x: number, y: number, count = 6): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      life: 0.2 + Math.random() * 0.15,
      maxLife: 0.35,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - dt,
    }))
    .filter((p) => p.life > 0);
}

export function resetGameState(levelIndex = 0) {
  const paddle = createPaddle();
  return {
    paddle,
    ball: createBallOnPaddle(paddle),
    bricks: loadLevelBricks(levelIndex),
    score: 0,
    lives: START_LIVES,
    levelIndex,
    combo: 0,
    lastHitTime: 0,
    endlessWave: 0,
    ballSpeed: BALL_SPEED_START,
  };
}

export function parseHighscore(raw: string | null): number {
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function updateHighscore(current: number, score: number): number {
  return score > current ? score : current;
}

export function shouldSimulate(phase: string): boolean {
  return phase === 'playing';
}

export function shrinkPaddleForLevel(paddle: Paddle, levelIndex: number): void {
  const shrink = Math.min(24, levelIndex * 4);
  paddle.width = Math.max(56, PADDLE_WIDTH - shrink);
  paddle.x = clampPaddleX(paddle, paddle.x);
}

export function speedForLevel(baseSpeed: number, levelIndex: number): number {
  return Math.min(BALL_SPEED_MAX, baseSpeed + levelIndex * 15);
}
