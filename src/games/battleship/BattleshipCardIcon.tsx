import { PixelSprite } from '../../components/PixelSprite';
import './BattleshipCardIcon.css';

/** Kleines Schiff + Wasserfeld als Icon */
const SHIP = [
  '0011100',
  '0111110',
  '1111111',
  '0111110',
  '0011100',
];

export function BattleshipCardIcon() {
  return (
    <div className="bs-card-icon" aria-hidden>
      <div className="bs-card-icon__grid">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="bs-card-icon__cell" />
        ))}
      </div>
      <div className="bs-card-icon__ship">
        <PixelSprite sprite={SHIP} pixelSize={2} />
      </div>
    </div>
  );
}
