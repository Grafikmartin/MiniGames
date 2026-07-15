import type { Orientation } from './types';
import { COLORS } from './constants';

export type SegmentPart = 'bow' | 'middle' | 'stern';

/** Zeichnet ein Schiffssegment als gefüllte Pixelfläche (16×16 intern). */
export function drawShipSegment(
  ctx: CanvasRenderingContext2D,
  size: number,
  part: SegmentPart,
  orientation: Orientation,
  color: string,
  damaged = false,
) {
  const px = size / 16;
  ctx.fillStyle = color;

  const fill = (x: number, y: number, w: number, h: number) => {
    ctx.fillRect(x * px, y * px, w * px, h * px);
  };

  const hull = (xs: number[][]) => {
    for (const [x, y, w, h] of xs) fill(x, y, w, h);
  };

  const isHoriz = orientation === 'horizontal';
  const bowPoints = isHoriz
    ? [
        [0, 6, 2, 4], [2, 5, 2, 6], [4, 4, 2, 8], [6, 3, 4, 10], [10, 3, 6, 10],
      ]
    : [
        [6, 0, 4, 2], [5, 2, 6, 2], [4, 4, 8, 2], [3, 6, 10, 4], [3, 10, 10, 6],
      ];

  const sternPoints = isHoriz
    ? [
        [0, 3, 10, 10], [10, 4, 2, 8], [12, 5, 2, 6], [14, 6, 2, 4],
        [13, 4, 1, 1], [13, 11, 1, 1], [14, 5, 1, 2], [14, 9, 1, 2],
      ]
    : [
        [3, 0, 10, 10], [4, 10, 8, 2], [5, 12, 6, 2], [6, 14, 4, 2],
        [4, 13, 1, 1], [11, 13, 1, 1], [5, 14, 2, 1], [9, 14, 2, 1],
      ];

  const middlePoints = isHoriz
    ? [[1, 3, 14, 10]]
    : [[3, 1, 10, 14]];

  if (part === 'bow') hull(bowPoints as number[][]);
  else if (part === 'stern') hull(sternPoints as number[][]);
  else hull(middlePoints as number[][]);

  if (damaged) {
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 6; i++) {
      const x = (2 + i * 2) % 14;
      const y = 4 + (i % 3) * 3;
      fill(x, y, 1, 1);
    }
  }
}

export function getSegmentPart(index: number, length: number): SegmentPart {
  if (index === 0) return 'bow';
  if (index === length - 1) return 'stern';
  return 'middle';
}

export function drawWaterCell(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = COLORS.cellBg;
  ctx.fillRect(0, 0, size, size);

  const px = size / 16;
  ctx.fillStyle = COLORS.cellDot;
  for (let y = 1; y < 15; y += 4) {
    for (let x = 1; x < 15; x += 4) {
      ctx.fillRect(x * px, y * px, px, px);
    }
  }
}

export function drawMissMarker(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size / 16);
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.5);
  ctx.lineTo(size * 0.7, size * 0.5);
  ctx.moveTo(size * 0.5, size * 0.3);
  ctx.lineTo(size * 0.5, size * 0.7);
  ctx.stroke();
}

export function drawHitMarker(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size / 8);
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.2);
  ctx.lineTo(size * 0.8, size * 0.8);
  ctx.moveTo(size * 0.8, size * 0.2);
  ctx.lineTo(size * 0.2, size * 0.8);
  ctx.stroke();
}

export function drawSunkPattern(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#000000';
  const px = size / 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * px, y * px, px, px);
    }
  }
}

/** Retro-Schusseffekt: Radar-Ping von der Mitte – ohne Bewegung im Raster. */
export function drawShotEffect(ctx: CanvasRenderingContext2D, size: number, progress: number) {
  const px = size / 16;
  const fg = '#33ff33';
  const dim = '#1a661a';

  const fillPx = (x: number, y: number, w = 1, h = 1) => {
    ctx.fillRect(x * px, y * px, w * px, h * px);
  };

  const cx = 8;
  const cy = 8;

  // Mittelpunkt kurz aufleuchten
  if (progress < 0.25) {
    ctx.fillStyle = fg;
    fillPx(cx - 1, cy - 1, 2, 2);
    if (progress < 0.12) fillPx(cx - 2, cy - 2, 4, 4);
    return;
  }

  const ringT = (progress - 0.25) / 0.75;
  const r = 1 + Math.floor(ringT * 6);

  ctx.fillStyle = ringT > 0.65 ? dim : fg;
  for (let i = -r; i <= r; i++) {
    fillPx(cx + i, cy - r, 1, 1);
    fillPx(cx + i, cy + r, 1, 1);
    fillPx(cx - r, cy + i, 1, 1);
    fillPx(cx + r, cy + i, 1, 1);
  }

  if (ringT > 0.35) {
    const r2 = Math.max(1, r - 2);
    ctx.fillStyle = dim;
    for (let i = -r2; i <= r2; i++) {
      fillPx(cx + i, cy - r2, 1, 1);
      fillPx(cx + i, cy + r2, 1, 1);
      fillPx(cx - r2, cy + i, 1, 1);
      fillPx(cx + r2, cy + i, 1, 1);
    }
  }
}
