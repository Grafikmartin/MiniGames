import { useCallback, useEffect, useRef } from 'react';
import { COLORS, SHIP_PIXEL } from './constants';
import {
  drawHitMarker,
  drawMissMarker,
  drawShipSegment,
  drawShotEffect,
  drawSunkPattern,
  drawWaterCell,
  type SegmentPart,
} from './shipDrawing';
import type { Orientation } from './types';
import './ShipCell.css';

const SHOT_ANIM_MS = 280;

interface ShipCellProps {
  part?: SegmentPart;
  orientation?: Orientation;
  showShip?: boolean;
  showWater?: boolean;
  miss?: boolean;
  hit?: boolean;
  sunk?: boolean;
  preview?: boolean;
  invalid?: boolean;
  selected?: boolean;
  cursor?: boolean;
  disabled?: boolean;
  animating?: boolean;
}

export function ShipCell({
  part = 'middle',
  orientation = 'horizontal',
  showShip = false,
  showWater = true,
  miss = false,
  hit = false,
  sunk = false,
  preview = false,
  invalid = false,
  selected = false,
  cursor = false,
  disabled = false,
  animating = false,
}: ShipCellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  const paintBase = useCallback(
    (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.clearRect(0, 0, size, size);
      if (showWater) drawWaterCell(ctx, size);

      if (showShip || preview) {
        drawShipSegment(
          ctx,
          size,
          part,
          orientation,
          preview ? (invalid ? COLORS.dim : COLORS.fg) : COLORS.fg,
          hit || sunk,
        );
        if (sunk) drawSunkPattern(ctx, size);
      }

      if (miss) drawMissMarker(ctx, size, COLORS.fg);
      if (hit && !showShip) drawHitMarker(ctx, size, COLORS.fg);
    },
    [part, orientation, showShip, showWater, miss, hit, sunk, preview, invalid],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paintBase(ctx, canvas.width);
  }, [paintBase]);

  useEffect(() => {
    const fx = fxRef.current;
    if (!fx) return;
    const ctx = fx.getContext('2d');
    if (!ctx) return;

    if (!animating) {
      ctx.clearRect(0, 0, fx.width, fx.height);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const size = fx.width;

    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / SHOT_ANIM_MS);
      ctx.clearRect(0, 0, size, size);
      drawShotEffect(ctx, size, progress);
      if (progress < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animating]);

  const classNames = [
    'bs-cell',
    preview && (invalid ? 'bs-cell--invalid' : 'bs-cell--preview'),
    selected && 'bs-cell--selected',
    cursor && 'bs-cell--cursor',
    disabled && 'bs-cell--disabled',
    animating && 'bs-cell--animating',
    sunk && 'bs-cell--sunk',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="bs-cell-wrap">
      <canvas ref={canvasRef} className={classNames} width={SHIP_PIXEL} height={SHIP_PIXEL} aria-hidden />
      <canvas ref={fxRef} className="bs-cell-fx" width={SHIP_PIXEL} height={SHIP_PIXEL} aria-hidden />
    </div>
  );
};
