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
  'ping-pong': [
    '1100000000011',
    '1100000000011',
    '1100000000011',
    '1100001000011',
    '1100000000011',
    '1100000000011',
    '1100000000011',
  ],
};
