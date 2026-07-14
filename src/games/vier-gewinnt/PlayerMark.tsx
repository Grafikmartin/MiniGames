import { PixelSprite } from '../../components/PixelSprite';
import type { Mark } from './gameLogic';
import { MARK_PIXEL, markSprites } from './markSprites';
import './PlayerMark.css';

interface PlayerMarkProps {
  mark: Mark;
  animate?: boolean;
}

export function PlayerMark({ mark, animate = false }: PlayerMarkProps) {
  return (
    <span className={`vg-mark${animate ? ' vg-mark--fall' : ''}`}>
      <PixelSprite sprite={markSprites[mark]} pixelSize={MARK_PIXEL} className="vg-mark-sprite" />
    </span>
  );
}
