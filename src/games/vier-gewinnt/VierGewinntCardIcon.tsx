import { PixelSprite } from '../../components/PixelSprite';
import { MARK_PIXEL, markSprites } from './markSprites';
import './VierGewinntCardIcon.css';

export function VierGewinntCardIcon() {
  return (
    <div className="vg-card-icon" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <PixelSprite key={index} sprite={markSprites.player} pixelSize={MARK_PIXEL} />
      ))}
    </div>
  );
}
