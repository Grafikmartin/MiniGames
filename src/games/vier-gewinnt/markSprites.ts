import type { Mark } from './gameLogic';

/** Feinere 10×10-Pixelgrafiken für Spielsteine */
export const markSprites: Record<Mark, string[]> = {
  player: [
    '0011111100',
    '0111111110',
    '1110000111',
    '1100000011',
    '1100000011',
    '1100000011',
    '1100000011',
    '1110000111',
    '0111111110',
    '0011111100',
  ],
  computer: [
    '1000000001',
    '1100000011',
    '0110000110',
    '0011001100',
    '0001111000',
    '0001111000',
    '0011001100',
    '0110000110',
    '1100000011',
    '1000000001',
  ],
};

export const MARK_PIXEL = 3;
export const LEGEND_PIXEL = 2;
export const STATUS_PIXEL = 2;
