import { BOARD_SIZE } from './constants';
import { coordKey, getShipCells, isInBounds } from './gameLogic';
import { getSegmentPart } from './shipDrawing';
import { ShipCell } from './ShipCell';
import type {
  Board,
  Coordinate,
  PlacementPreview,
  RadarBoard,
  Ship,
} from './types';
import './BattleshipBoard.css';

interface BattleshipBoardProps {
  label: string;
  mode: 'own' | 'radar' | 'placement';
  board?: Board;
  ships?: Ship[];
  radar?: RadarBoard;
  preview?: PlacementPreview | null;
  cursor?: Coordinate;
  selectedTargets?: Coordinate[];
  animatingCells?: Coordinate[];
  disabled?: boolean;
  active?: boolean;
  onCellPointer?: (coord: Coordinate) => void;
}

export function BattleshipBoard({
  label,
  mode,
  board,
  ships = [],
  radar,
  preview,
  cursor,
  selectedTargets = [],
  animatingCells = [],
  disabled = false,
  active = false,
  onCellPointer,
}: BattleshipBoardProps) {
  const previewCells = new Set<string>();
  if (preview) {
    const pseudoShip = {
      origin: preview.origin,
      orientation: preview.orientation,
      length: preview.length,
    };
    for (const c of getShipCells(pseudoShip)) {
      if (isInBounds(c)) previewCells.add(coordKey(c));
    }
  }

  const shipCellIndex = new Map<string, { ship: Ship; index: number }>();
  for (const ship of ships) {
    getShipCells(ship).forEach((c, index) => {
      shipCellIndex.set(coordKey(c), { ship, index });
    });
  }

  const selectedSet = new Set(selectedTargets.map(coordKey));
  const animSet = new Set(animatingCells.map(coordKey));

  return (
    <div className="bs-board-wrap">
      <h3 className="bs-board-label">{label}</h3>
      <div
        className={`bs-board${active ? ' bs-board--active' : ''}`}
        role="grid"
        aria-label={label}
        style={{ touchAction: 'manipulation' }}
      >
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const coord = { row, col };
            const key = coordKey(coord);
            const isCursor = cursor?.row === row && cursor?.col === col;
            const isSelected = selectedSet.has(key);
            const isAnimating = animSet.has(key);
            const isPreview = previewCells.has(key);
            const shipInfo = shipCellIndex.get(key);
            const cell = board?.[row]?.[col];
            const radarCell = radar?.[row]?.[col];

            let showShip = false;
            let part: 'bow' | 'middle' | 'stern' = 'middle';
            let orientation: 'horizontal' | 'vertical' = 'horizontal';
            let miss = false;
            let hit = false;
            let sunk = false;

            if (mode === 'own' || mode === 'placement') {
              showShip = !!cell?.shipId && !!shipInfo;
              if (shipInfo) {
                part = getSegmentPart(shipInfo.index, shipInfo.ship.length);
                orientation = shipInfo.ship.orientation;
              }
              if (cell?.shot === 'miss') miss = true;
              if (cell?.shot === 'hit') {
                hit = true;
                if (shipInfo?.ship.sunk) sunk = true;
              }
            }

            if (mode === 'radar' && radarCell) {
              miss = radarCell.shot === 'miss';
              hit = radarCell.shot === 'hit' || radarCell.shot === 'sunk';
              sunk = radarCell.shot === 'sunk';
              if (sunk && shipInfo) {
                showShip = true;
                part = getSegmentPart(shipInfo.index, shipInfo.ship.length);
                orientation = shipInfo.ship.orientation;
              }
            }

            return (
              <button
                key={key}
                type="button"
                className="bs-board-cell"
                disabled={disabled && mode === 'radar'}
                aria-label={`Feld ${row + 1}, ${col + 1}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onCellPointer?.(coord);
                }}
              >
                <ShipCell
                  part={part}
                  orientation={orientation}
                  showShip={showShip}
                  showWater={mode !== 'placement' || !isPreview}
                  miss={miss}
                  hit={hit}
                  sunk={sunk}
                  preview={isPreview && mode === 'placement'}
                  invalid={isPreview && !preview?.valid}
                  selected={isSelected}
                  cursor={isCursor}
                  disabled={disabled}
                  animating={isAnimating}
                />
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
