import type { GameMode } from './constants';

export type BrickCell = 0 | 1 | 2 | 3;
export type BrickType = 1 | 2 | 3;

export type GamePhase =
  | 'menu'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'lifeLost'
  | 'levelComplete'
  | 'gameOver';

export interface BreakoutLevel {
  id: string;
  name: string;
  layout: BrickCell[][];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  speed: number;
  launched: boolean;
}

export interface Brick {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  hits: number;
  alive: boolean;
  flashUntil: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface GameSnapshot {
  score: number;
  lives: number;
  levelIndex: number;
  mode: GameMode;
  combo: number;
}
