import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  WALL_THICKNESS,
} from './constants';
import type { Ball, Brick, Paddle, Particle } from './types';

export function drawScene(
  ctx: CanvasRenderingContext2D,
  paddle: Paddle,
  ball: Ball,
  bricks: Brick[],
  particles: Particle[],
  now: number,
  paddleFlashUntil: number,
  reducedMotion: boolean,
): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = WALL_THICKNESS;
  ctx.strokeRect(
    WALL_THICKNESS / 2,
    WALL_THICKNESS / 2,
    CANVAS_WIDTH - WALL_THICKNESS,
    CANVAS_HEIGHT - WALL_THICKNESS / 2,
  );

  for (const brick of bricks) {
    if (!brick.alive) continue;
    drawBrick(ctx, brick, now);
  }

  if (now < paddleFlashUntil) {
    ctx.globalAlpha = 0.6;
  }
  drawPaddle(ctx, paddle);
  ctx.globalAlpha = 1;

  drawBall(ctx, ball);

  if (!reducedMotion) {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = COLORS.fgBright;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle) {
  ctx.fillStyle = COLORS.fg;
  ctx.fillRect(
    Math.round(paddle.x),
    Math.round(paddle.y),
    Math.round(paddle.width),
    Math.round(paddle.height),
  );
  ctx.fillStyle = COLORS.bg;
  const mid = Math.round(paddle.x + paddle.width / 2);
  ctx.fillRect(mid - 1, Math.round(paddle.y + 3), 2, paddle.height - 6);
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  const cx = Math.round(ball.x + ball.size / 2);
  const cy = Math.round(ball.y + ball.size / 2);
  const r = ball.size / 2;
  ctx.fillStyle = COLORS.fgBright;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.fg;
  ctx.fillRect(cx - 2, cy - 2, 4, 4);
}

function drawBrick(ctx: CanvasRenderingContext2D, brick: Brick, now: number) {
  const x = Math.round(brick.x);
  const y = Math.round(brick.y);
  const w = Math.round(brick.width);
  const h = Math.round(brick.height);
  const flashing = now < brick.flashUntil;

  if (brick.type === 3) {
    ctx.strokeStyle = COLORS.indestructible;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.beginPath();
    for (let i = -h; i < w; i += 6) {
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + h, y + h);
    }
    ctx.stroke();
    return;
  }

  const damaged = brick.type === 2 && brick.hits > 0;
  ctx.fillStyle = damaged ? COLORS.brickStrong : flashing ? COLORS.fgBright : COLORS.fg;
  ctx.fillRect(x, y, w, h);

  if (brick.type === 2 && !damaged) {
    ctx.fillStyle = COLORS.bg;
    for (let row = 0; row < h; row += 4) {
      ctx.fillRect(x, y + row, w, 2);
    }
  } else if (brick.type === 1) {
    ctx.strokeStyle = COLORS.bg;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  } else if (damaged) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(x + w / 2 - 2, y + 3, 4, h - 6);
  }
}

export function setupCanvasDpr(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(CANVAS_WIDTH * dpr);
  canvas.height = Math.round(CANVAS_HEIGHT * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return dpr;
}
