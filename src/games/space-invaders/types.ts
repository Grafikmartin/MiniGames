export interface Position {
  x: number;
  y: number;
}

export interface Bullet extends Position {
  hit?: boolean;
}

export interface Enemy extends Position {
  alive: boolean;
}

export interface EnemyGroup extends Array<Enemy> {
  speedX?: number;
  shootChance?: number;
}

export interface Player extends Position {}

export interface GameState {
  level: number;
  player: Player;
  bullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: EnemyGroup;
  keys: Record<string, boolean>;
  score: number;
  lives: number;
  gameOver: boolean;
  hitFlash: number;
  invincible: boolean;
  paused: boolean;
  highscore: number;
  musicPlaying: boolean;
  enemyCanFire: boolean;
  soundEnabled: boolean;
}

export type OverlayState = 'start' | 'playing' | 'gameOver' | 'win';
