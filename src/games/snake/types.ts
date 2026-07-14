export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export type GamePhase = 'start' | 'playing' | 'paused' | 'gameOver';
