export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 400;

export const PADDLE_WIDTH = 8;
export const PADDLE_HEIGHT = 64;
export const BALL_SIZE = 8;

export const STORAGE_SETTINGS = 'pongSettings';
export const STORAGE_STANDARD_HI = 'pongStandardHighscore';
export const STORAGE_SURVIVAL_HI = 'pongSurvivalHighscore';

export const COLORS = {
  bg: '#000000',
  fg: '#33ff33',
  fgDim: '#99ff99',
  flash: '#66ff66',
  overlay: 'rgba(0, 0, 0, 0.85)',
} as const;

export const DIFFICULTY_SPEEDS = {
  easy: { paddle: 5, ball: 4 },
  medium: { paddle: 7, ball: 5 },
  hard: { paddle: 9, ball: 6 },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_SPEEDS;
export type UserSide = 'left' | 'right';
export type GameMode = 'standard' | 'survival';

export interface GameSettings {
  difficulty: Difficulty;
  maxPoints: number;
  soundOn: boolean;
  userSide: UserSide;
  gameMode: GameMode;
}

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  maxPoints: 10,
  soundOn: true,
  userSide: 'left',
  gameMode: 'standard',
};
