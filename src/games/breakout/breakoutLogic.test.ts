import { describe, expect, it } from 'vitest';
import {
  BALL_SPEED_START,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  SCORE_STANDARD,
  SCORE_STRONG_DESTROY,
  SCORE_STRONG_HIT,
  START_LIVES,
  WALL_THICKNESS,
} from './constants';
import {
  createBallOnPaddle,
  createBricksFromLayout,
  createPaddle,
  isLevelComplete,
  launchBall,
  loadLevelBricks,
  parseHighscore,
  reflectPaddleHit,
  resetGameState,
  resolveBrickCollision,
  resolvePaddleCollision,
  resolveWallCollision,
  shouldSimulate,
  stepBall,
  updateHighscore,
} from './breakoutLogic';
import type { Ball } from './types';

describe('Breakout Wände', () => {
  it('prallt an linker Wand ab', () => {
    const ball: Ball = {
      x: WALL_THICKNESS,
      y: 200,
      size: 10,
      vx: -200,
      vy: 100,
      speed: 200,
      launched: true,
    };
    const hit = resolveWallCollision(ball);
    expect(hit?.type).toBe('left');
    expect(ball.vx).toBeGreaterThan(0);
  });

  it('prallt an rechter Wand ab', () => {
    const right = CANVAS_WIDTH - WALL_THICKNESS - 10;
    const ball: Ball = {
      x: right,
      y: 200,
      size: 10,
      vx: 200,
      vy: 100,
      speed: 200,
      launched: true,
    };
    const hit = resolveWallCollision(ball);
    expect(hit?.type).toBe('right');
    expect(ball.vx).toBeLessThan(0);
  });

  it('prallt an oberer Wand ab', () => {
    const ball: Ball = {
      x: 200,
      y: WALL_THICKNESS,
      size: 10,
      vx: 100,
      vy: -200,
      speed: 200,
      launched: true,
    };
    const hit = resolveWallCollision(ball);
    expect(hit?.type).toBe('top');
    expect(ball.vy).toBeGreaterThan(0);
  });
});

describe('Breakout Schläger', () => {
  it('erkennt Schlägertreffer', () => {
    const paddle = createPaddle();
    const ball: Ball = {
      x: paddle.x + paddle.width / 2 - 5,
      y: paddle.y - 8,
      size: 10,
      vx: 50,
      vy: 200,
      speed: 200,
      launched: true,
    };
    expect(resolvePaddleCollision(ball, paddle)).toBe(true);
  });

  it('ändert Abprallwinkel nach Trefferposition', () => {
    const paddle = createPaddle();
    const leftBall: Ball = {
      x: paddle.x + 5,
      y: paddle.y - 8,
      size: 10,
      vx: 0,
      vy: 200,
      speed: 260,
      launched: true,
    };
    reflectPaddleHit(leftBall, paddle);
    const leftVx = leftBall.vx;

    const rightBall: Ball = {
      x: paddle.x + paddle.width - 15,
      y: paddle.y - 8,
      size: 10,
      vx: 0,
      vy: 200,
      speed: 260,
      launched: true,
    };
    reflectPaddleHit(rightBall, paddle);
    expect(leftVx).toBeLessThan(0);
    expect(rightBall.vx).toBeGreaterThan(0);
  });
});

describe('Breakout Blöcke', () => {
  it('zerstört Standardblock', () => {
    const bricks = createBricksFromLayout([[1]]);
    const brick = bricks[0];
    const ball: Ball = {
      x: brick.x + brick.width / 2 - 5,
      y: brick.y + brick.height,
      size: 10,
      vx: 0,
      vy: -200,
      speed: 200,
      launched: true,
    };
    const hit = resolveBrickCollision(ball, bricks);
    expect(hit?.destroyed).toBe(true);
    expect(hit?.score).toBe(SCORE_STANDARD);
    expect(brick.alive).toBe(false);
  });

  it('verstärkter Block benötigt zwei Treffer', () => {
    const bricks = createBricksFromLayout([[2]]);
    const brick = bricks[0];
    const ball: Ball = {
      x: brick.x + brick.width / 2 - 5,
      y: brick.y + brick.height,
      size: 10,
      vx: 0,
      vy: -200,
      speed: 200,
      launched: true,
    };
    const first = resolveBrickCollision(ball, bricks);
    expect(first?.destroyed).toBe(false);
    expect(first?.score).toBe(SCORE_STRONG_HIT);
    expect(brick.alive).toBe(true);
    expect(brick.hits).toBe(1);

    ball.vy = -200;
    ball.y = brick.y + brick.height;
    const second = resolveBrickCollision(ball, bricks);
    expect(second?.destroyed).toBe(true);
    expect(second?.score).toBe(SCORE_STRONG_DESTROY);
    expect(brick.alive).toBe(false);
  });

  it('unzerstörbare Blöcke verhindern Levelabschluss nicht', () => {
    const bricks = createBricksFromLayout([
      [3, 3],
      [0, 0],
    ]);
    expect(isLevelComplete(bricks)).toBe(true);
  });

  it('Level endet wenn alle zerstörbaren Blöcke weg sind', () => {
    const bricks = loadLevelBricks(0);
    for (const brick of bricks) brick.alive = false;
    expect(isLevelComplete(bricks)).toBe(true);
  });
});

describe('Breakout Spielablauf', () => {
  it('Ballverlust unterhalb des Schlägers', () => {
    const paddle = createPaddle();
    const ball = createBallOnPaddle(paddle);
    launchBall(ball, paddle);
    ball.y = CANVAS_HEIGHT;
    ball.vy = 300;
    const result = stepBall(ball, paddle, [], 0.016);
    expect(result.ballLost).toBe(true);
  });

  it('Pause stoppt die Simulation', () => {
    expect(shouldSimulate('playing')).toBe(true);
    expect(shouldSimulate('paused')).toBe(false);
    expect(shouldSimulate('ready')).toBe(false);
  });

  it('Spiel endet bei null Leben', () => {
    let lives = START_LIVES;
    lives -= 1;
    lives -= 1;
    lives -= 1;
    expect(lives).toBe(0);
  });

  it('Neustart setzt Werte zurück', () => {
    const a = resetGameState();
    a.score = 500;
    a.lives = 1;
    const b = resetGameState();
    expect(b.score).toBe(0);
    expect(b.lives).toBe(START_LIVES);
    expect(b.ball.speed).toBe(BALL_SPEED_START);
  });
});

describe('Breakout Highscore', () => {
  it('parst ungültige Werte sicher', () => {
    expect(parseHighscore(null)).toBe(0);
    expect(parseHighscore('abc')).toBe(0);
    expect(parseHighscore('-5')).toBe(0);
    expect(parseHighscore('120')).toBe(120);
  });

  it('aktualisiert Highscore nur nach oben', () => {
    expect(updateHighscore(100, 50)).toBe(100);
    expect(updateHighscore(100, 150)).toBe(150);
  });
});

describe('Breakout Ballstart', () => {
  it('startet Ball nicht automatisch', () => {
    const paddle = createPaddle();
    const ball = createBallOnPaddle(paddle);
    expect(ball.launched).toBe(false);
    expect(ball.vx).toBe(0);
    expect(ball.vy).toBe(0);
  });

  it('startet Ball nach launchBall', () => {
    const paddle = createPaddle();
    const ball = createBallOnPaddle(paddle);
    launchBall(ball, paddle);
    expect(ball.launched).toBe(true);
    expect(ball.vy).toBeLessThan(0);
  });
});
