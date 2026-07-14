export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

export const PLAYER_SPRITE = ['0011100', '0111110', '1111111', '1111111', '0111110'];
export const ENEMY_SPRITE = ['00100', '01110', '11111', '10101', '01010'];
export const PIXEL = 4;

export const PLAYER_WIDTH = PLAYER_SPRITE[0].length * PIXEL;
export const PLAYER_HEIGHT = PLAYER_SPRITE.length * PIXEL;
export const ENEMY_WIDTH = ENEMY_SPRITE[0].length * PIXEL;
export const ENEMY_HEIGHT = ENEMY_SPRITE.length * PIXEL;

export const PLAYER_SPEED = 4;
export const BULLET_WIDTH = 2 * PIXEL;
export const BULLET_HEIGHT = 5 * PIXEL;
export const BULLET_SPEED = 7;

export const ENEMY_ROWS_BASE = 4;
export const ENEMY_COLS_BASE = 8;
export const ENEMY_H_SPACING = 10;
export const ENEMY_V_SPACING = 20;
export const ENEMY_START_Y = 60;
export const ENEMY_STEP_DOWN = 20;
export const ENEMY_BULLET_SPEED = 3;

export const ENEMY_SPEED_X_BASE = 1;
export const ENEMY_SHOOT_CHANCE_BASE = 0.002;

export const STORAGE_KEY = 'spaceinvaders_highscore';
