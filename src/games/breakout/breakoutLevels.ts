import type { BreakoutLevel, BrickCell } from './types';

const R = 1;
const S = 2;
const I = 3;

function rect(rows: number, cols: number, fill: BrickCell): BrickCell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function pyramid(rows: number, cols: number): BrickCell[][] {
  const layout: BrickCell[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let row = 0; row < rows; row++) {
    const width = row + 1;
    const start = Math.floor((cols - width) / 2);
    for (let c = start; c < start + width; c++) {
      layout[row][c] = R;
    }
  }
  return layout;
}

function frame(rows: number, cols: number): BrickCell[][] {
  const layout = rect(rows, cols, 0);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
        layout[row][col] = R;
      }
    }
  }
  return layout;
}

/** Retro „M“ aus Blöcken (6×10 Raster). */
function letterM(): BrickCell[][] {
  const layout = rect(6, 10, 0);
  const m = [
    '1...1...1.',
    '11..1..11.',
    '1.1.1.1.1.',
    '1..1.1..1.',
    '1...1...1.',
    '1...1...1.',
  ];
  for (let row = 0; row < m.length; row++) {
    for (let col = 0; col < m[row].length; col++) {
      if (m[row][col] === '1') layout[row][col] = R;
    }
  }
  return layout;
}

export const BREAKOUT_LEVELS: BreakoutLevel[] = [
  {
    id: 'full',
    name: 'Volles Feld',
    layout: rect(6, 10, R),
  },
  {
    id: 'pyramid',
    name: 'Pyramide',
    layout: pyramid(6, 10),
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    layout: (() => {
      const layout = rect(6, 10, 0);
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 10; col++) {
          if ((row + col) % 2 === 0) layout[row][col] = R;
        }
      }
      return layout;
    })(),
  },
  {
    id: 'frame',
    name: 'Rahmen',
    layout: (() => {
      const base = frame(6, 10);
      for (let col = 2; col < 8; col++) base[2][col] = S;
      base[3][4] = I;
      base[3][5] = I;
      return base;
    })(),
  },
  {
    id: 'retro-m',
    name: 'Retro M',
    layout: (() => {
      const base = letterM();
      for (let row = 0; row < 6; row++) {
        if (row % 2 === 1) {
          for (let col = 0; col < 10; col++) {
            if (base[row][col] === R) base[row][col] = S;
          }
        }
      }
      return base;
    })(),
  },
];

export function getLevel(index: number): BreakoutLevel {
  return BREAKOUT_LEVELS[index % BREAKOUT_LEVELS.length];
}

export function endlessLevelIndex(wave: number): number {
  return wave % BREAKOUT_LEVELS.length;
}
