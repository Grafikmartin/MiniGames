export type PixelGrid = string[];

/** Gleiche Pixelgröße wie im Space-Invaders-Spiel */
export const ICON_PIXEL = 4;

export const gameSprites: Record<string, PixelGrid> = {
  'space-invaders': [
    '00100',
    '01110',
    '11111',
    '10101',
    '01010',
  ],
  'vier-gewinnt': [
    '00100',
    '00100',
    '11111',
    '00100',
    '00100',
    '00100',
    '00100',
  ],
  'ping-pong': [
    '10001',
    '10001',
    '10001',
    '00100',
    '01000',
  ],
  snake: [
    '00100',
    '01110',
    '00110',
    '00110',
    '00010',
    '00100',
  ],
};
