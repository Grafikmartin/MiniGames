import { PixelSprite } from '../../components/PixelSprite';
import './BattleshipCardIcon.css';

/**
 * Bug hebt sich aus dem Wasser (Heck versunken).
 * Spitze rechts oben, Rumpf verbreitert sich nach links zur Wasserlinie.
 */
const SHIP_BOW = [
  '............1',
  '...........11',
  '.........1111',
  '......1111111',
  '..11111111111',
];

export function BattleshipCardIcon() {
  return (
    <div className="bs-card-icon" aria-hidden>
      <div className="bs-card-icon__ship">
        <PixelSprite sprite={SHIP_BOW} pixelSize={3} />
      </div>
      <div className="bs-card-icon__sea" />
    </div>
  );
}
