import { PixelSprite } from '../../components/PixelSprite';
import './SnakeCardIcon.css';

const CELL = ['11', '11'];
const CELL_PIXEL = 2;

/** Erstes Segment = Kopf, zwei Kästchen Abstand zum Futter. */
const SNAKE_PATH = [
  { col: 5, row: 2 },
  { col: 4, row: 2 },
  { col: 3, row: 2 },
  { col: 2, row: 2 },
  { col: 1, row: 2 },
  { col: 1, row: 3 },
  { col: 1, row: 4 },
  { col: 2, row: 4 },
  { col: 3, row: 4 },
  { col: 4, row: 4 },
  { col: 4, row: 5 },
  { col: 4, row: 6 },
] as const;

const FOOD = { col: 8, row: 2 } as const;

export function SnakeCardIcon() {
  return (
    <div className="snake-card-icon" aria-hidden>
      {SNAKE_PATH.map((segment, index) => (
        <div
          key={`s-${index}`}
          className="snake-card-icon__cell snake-card-icon__cell--snake"
          style={{ gridColumn: segment.col, gridRow: segment.row }}
        >
          <PixelSprite sprite={[...CELL]} pixelSize={CELL_PIXEL} />
        </div>
      ))}
      <div
        className="snake-card-icon__cell snake-card-icon__cell--food"
        style={{ gridColumn: FOOD.col, gridRow: FOOD.row }}
      >
        <PixelSprite sprite={[...CELL]} pixelSize={CELL_PIXEL} />
      </div>
    </div>
  );
}
