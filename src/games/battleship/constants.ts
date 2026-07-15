import type { ShipType } from './types';

export const BOARD_SIZE = 10;
export const SHOTS_PER_TURN = 3;

/** Schiffe dürfen sich berühren, wenn true. */
export const ALLOW_SHIPS_TO_TOUCH = true;

export const COLORS = {
  bg: '#000000',
  fg: '#33ff33',
  dim: '#1a661a',
  grid: '#1a661a',
  cellBg: '#061206',
  cellDot: '#123612',
  panel: '#111111',
  border: '#555555',
  food: '#99ff99',
} as const;

export const SHIP_LENGTHS: Record<ShipType, number> = {
  battleship: 5,
  cruiser: 4,
  frigate: 3,
  submarine: 2,
};

export const SHIP_LABELS: Record<ShipType, string> = {
  battleship: 'Schlachtschiff',
  cruiser: 'Kreuzer',
  frigate: 'Fregatte',
  submarine: 'U-Boot',
};

export const PLACEMENT_ORDER: ShipType[] = [
  'battleship',
  'cruiser',
  'frigate',
  'frigate',
  'submarine',
];

export const SHIP_PIXEL = 16;
