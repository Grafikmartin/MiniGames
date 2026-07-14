import { useEffect, useRef } from 'react';
import './PixelSprite.css';

interface PixelSpriteProps {
  sprite: string[];
  pixelSize?: number;
  className?: string;
}

export function PixelSprite({ sprite, pixelSize = 4, className = '' }: PixelSpriteProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const color = getComputedStyle(wrap).color;
      const cols = sprite[0]?.length ?? 0;
      const rows = sprite.length;

      canvas.width = cols * pixelSize;
      canvas.height = rows * pixelSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      sprite.forEach((row, ry) =>
        [...row].forEach((cell, cx) => {
          if (cell === '1') {
            ctx.fillRect(cx * pixelSize, ry * pixelSize, pixelSize, pixelSize);
          }
        }),
      );
    };

    draw();

    const observer = new MutationObserver(draw);
    observer.observe(wrap, { attributes: true, attributeFilter: ['class', 'style'] });

    const parent = wrap.closest('.game-card, .coming-soon');
    parent?.addEventListener('mouseenter', draw);
    parent?.addEventListener('mouseleave', draw);

    return () => {
      observer.disconnect();
      parent?.removeEventListener('mouseenter', draw);
      parent?.removeEventListener('mouseleave', draw);
    };
  }, [sprite, pixelSize]);

  return (
    <div ref={wrapRef} className={`pixel-sprite-wrap ${className}`.trim()}>
      <canvas ref={canvasRef} className="pixel-sprite" aria-hidden />
    </div>
  );
}
