export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 600;

export const PADDLE_WIDTH = 88;
export const PADDLE_HEIGHT = 14;
export const PADDLE_Y_OFFSET = 48;
export const PADDLE_SPEED = 420;

export const BALL_SIZE = 10;
export const BALL_SPEED_START = 260;
export const BALL_SPEED_MAX = 520;
export const BALL_SPEED_INCREMENT = 12;
export const BALL_MAX_ANGLE = Math.PI / 3;

export const BRICK_COLS = 10;
export const BRICK_ROWS = 6;
export const BRICK_PADDING = 4;
export const BRICK_OFFSET_TOP = 56;
export const BRICK_OFFSET_LEFT = 16;

export const WALL_THICKNESS = 8;
export const MAX_DELTA_MS = 50;

export const START_LIVES = 3;
export const LEVEL_CLEAR_BONUS = 100;

export const SCORE_STANDARD = 10;
export const SCORE_STRONG_HIT = 5;
export const SCORE_STRONG_DESTROY = 15;
export const COMBO_WINDOW_MS = 900;
export const COMBO_BONUS = 5;

export const STORAGE_SETTINGS = 'breakoutSettings';
export const STORAGE_CLASSIC_HI = 'breakoutClassicHighscore';
export const STORAGE_ENDLESS_HI = 'breakoutEndlessHighscore';

export const COLORS = {
  bg: '#000000',
  fg: '#33ff33',
  fgDim: '#1a661a',
  fgBright: '#66ff66',
  border: '#555555',
  panel: '#111111',
  brickStrong: '#99ff99',
  indestructible: '#555555',
  overlay: 'rgba(0, 0, 0, 0.88)',
} as const;

export type GameMode = 'classic' | 'endless';

export interface GameSettings {
  mode: GameMode;
  soundOn: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'classic',
  soundOn: true,
};
