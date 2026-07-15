import {
  ALLOW_SHIPS_TO_TOUCH,
  BOARD_SIZE,
  DYNAMIC_SHOTS_TIER_HIGH_MIN,
  DYNAMIC_SHOTS_TIER_MID_MIN,
  PLACEMENT_ORDER,
  SHIP_LENGTHS,
  SHOTS_PER_TURN,
} from './constants';
import type {
  Board,
  Coordinate,
  GameMode,
  HuntState,
  Orientation,
  PlacementPreview,
  RadarBoard,
  Ship,
  ShipType,
  ShotResult,
} from './types';

export function coordKey(c: Coordinate): string {
  return `${c.row},${c.col}`;
}

export function parseCoordKey(key: string): Coordinate {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

export function isInBounds({ row, col }: Coordinate): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ shipId: null, shot: 'none' as const })),
  );
}

export function createEmptyRadar(): RadarBoard {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ shot: 'none' as const })),
  );
}

export function toggleOrientation(o: Orientation): Orientation {
  return o === 'horizontal' ? 'vertical' : 'horizontal';
}

export function getShipCells(ship: Pick<Ship, 'origin' | 'orientation' | 'length'>): Coordinate[] {
  const cells: Coordinate[] = [];
  for (let i = 0; i < ship.length; i++) {
    cells.push(
      ship.orientation === 'horizontal'
        ? { row: ship.origin.row, col: ship.origin.col + i }
        : { row: ship.origin.row + i, col: ship.origin.col },
    );
  }
  return cells;
}

export function canPlaceShip(
  board: Board,
  origin: Coordinate,
  length: number,
  orientation: Orientation,
  allowTouch = ALLOW_SHIPS_TO_TOUCH,
): boolean {
  const ship = { origin, orientation, length };
  const cells = getShipCells(ship);
  if (cells.some((c) => !isInBounds(c))) return false;

  for (const { row, col } of cells) {
    if (board[row][col].shipId !== null) return false;
  }

  if (!allowTouch) {
    const occupied = new Set<string>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c].shipId) occupied.add(coordKey({ row: r, col: c }));
      }
    }
    for (const cell of cells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const n = { row: cell.row + dr, col: cell.col + dc };
          if (isInBounds(n) && occupied.has(coordKey(n))) {
            const onOwnCell = cells.some((c) => c.row === n.row && c.col === n.col);
            if (!onOwnCell) return false;
          }
        }
      }
    }
  }

  return true;
}

export function createShip(
  type: ShipType,
  origin: Coordinate,
  orientation: Orientation,
  id?: string,
): Ship {
  return {
    id: id ?? `${type}-${origin.row}-${origin.col}-${orientation}`,
    type,
    length: SHIP_LENGTHS[type],
    orientation,
    origin,
    hits: 0,
    sunk: false,
  };
}

export function placeShipOnBoard(board: Board, ship: Ship): Board {
  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  for (const { row, col } of getShipCells(ship)) {
    next[row][col] = { ...next[row][col], shipId: ship.id };
  }
  return next;
}

export function buildPreview(
  type: ShipType,
  origin: Coordinate,
  orientation: Orientation,
  board: Board,
): PlacementPreview {
  const length = SHIP_LENGTHS[type];
  return {
    type,
    length,
    orientation,
    origin,
    valid: canPlaceShip(board, origin, length, orientation),
  };
}

export function defaultPreviewOrigin(index: number): Coordinate {
  return { row: Math.min(index, BOARD_SIZE - 1), col: 0 };
}

export function randomPlacement(rng: () => number = Math.random): {
  board: Board;
  ships: Ship[];
} {
  const allOrigins = (): Coordinate[] => {
    const coords: Coordinate[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) coords.push({ row, col });
    }
    return coords;
  };

  const shuffleCoords = (coords: Coordinate[]) => {
    const copy = [...coords];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  for (let round = 0; round < 50; round++) {
    let board = createEmptyBoard();
    const ships: Ship[] = [];
    let failed = false;

    for (const type of PLACEMENT_ORDER) {
      const length = SHIP_LENGTHS[type];
      const orientations: Orientation[] = rng() < 0.5 ? ['horizontal', 'vertical'] : ['vertical', 'horizontal'];
      let placed = false;

      for (const orientation of orientations) {
        for (const origin of shuffleCoords(allOrigins())) {
          if (canPlaceShip(board, origin, length, orientation)) {
            const ship = createShip(type, origin, orientation, `${type}-${ships.length}`);
            board = placeShipOnBoard(board, ship);
            ships.push(ship);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed) return { board, ships };
  }

  throw new Error('randomPlacement: Keine gültige Anordnung gefunden.');
}

export function countRemainingShipCells(ships: Ship[]): number {
  return ships.filter((s) => !s.sunk).reduce((sum, s) => sum + s.length - s.hits, 0);
}

export function countRemainingShips(ships: Ship[]): number {
  return ships.filter((s) => !s.sunk).length;
}

/** Flottenstärke: Summe der Längen aller nicht versenkten Schiffe (Treffer zählen nicht). */
export function fleetStrength(ships: Ship[]): number {
  return ships.filter((s) => !s.sunk).reduce((sum, s) => sum + s.length, 0);
}

/** Schüsse pro Zug aus Flottenstärke – zentrale Berechnung für Spieler und KI. */
export function shotsPerTurnForFleet(strength: number, mode: GameMode): number {
  if (mode === 'classic') return SHOTS_PER_TURN;
  if (strength <= 0) return 0;
  if (strength >= DYNAMIC_SHOTS_TIER_HIGH_MIN) return 3;
  if (strength >= DYNAMIC_SHOTS_TIER_MID_MIN) return 2;
  return 1;
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.every((s) => s.sunk);
}

export function applyShot(
  board: Board,
  ships: Ship[],
  coord: Coordinate,
): { board: Board; ships: Ship[]; result: ShotResult } {
  const nextBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const nextShips = ships.map((s) => ({ ...s }));

  if (!isInBounds(coord)) {
    return {
      board: nextBoard,
      ships: nextShips,
      result: { coord, hit: false, sunk: false, shipId: null },
    };
  }

  const cell = nextBoard[coord.row][coord.col];
  if (cell.shot !== 'none') {
    return {
      board: nextBoard,
      ships: nextShips,
      result: { coord, hit: cell.shot === 'hit', sunk: false, shipId: cell.shipId },
    };
  }

  if (cell.shipId) {
    cell.shot = 'hit';
    const ship = nextShips.find((s) => s.id === cell.shipId);
    if (ship) {
      ship.hits += 1;
      if (ship.hits >= ship.length) {
        ship.sunk = true;
        for (const c of getShipCells(ship)) {
          nextBoard[c.row][c.col].shot = 'hit';
        }
        return {
          board: nextBoard,
          ships: nextShips,
          result: { coord, hit: true, sunk: true, shipId: ship.id },
        };
      }
    }
    return {
      board: nextBoard,
      ships: nextShips,
      result: { coord, hit: true, sunk: false, shipId: cell.shipId },
    };
  }

  cell.shot = 'miss';
  return {
    board: nextBoard,
    ships: nextShips,
    result: { coord, hit: false, sunk: false, shipId: null },
  };
}

export function applyRadarShot(radar: RadarBoard, result: ShotResult): RadarBoard {
  const next = radar.map((row) => row.map((cell) => ({ ...cell })));
  const { coord, hit, sunk } = result;
  if (!isInBounds(coord)) return next;
  next[coord.row][coord.col].shot = sunk ? 'sunk' : hit ? 'hit' : 'miss';
  if (sunk && result.shipId) {
    // Mark all sunk cells on radar - caller may need ship cells; handled in reducer
  }
  return next;
}

export function markSunkOnRadar(
  radar: RadarBoard,
  ship: Ship,
): RadarBoard {
  const next = radar.map((row) => row.map((cell) => ({ ...cell })));
  for (const c of getShipCells(ship)) {
    if (isInBounds(c)) next[c.row][c.col].shot = 'sunk';
  }
  return next;
}

export function isAlreadyShot(radar: RadarBoard, coord: Coordinate): boolean {
  if (!isInBounds(coord)) return true;
  return radar[coord.row][coord.col].shot !== 'none';
}

export function isAlreadyShotBoard(board: Board, coord: Coordinate): boolean {
  if (!isInBounds(coord)) return true;
  return board[coord.row][coord.col].shot !== 'none';
}

export function toggleTarget(
  targets: Coordinate[],
  coord: Coordinate,
  radar: RadarBoard,
): Coordinate[] {
  if (isAlreadyShot(radar, coord)) return targets;
  const key = coordKey(coord);
  const idx = targets.findIndex((t) => coordKey(t) === key);
  if (idx >= 0) {
    return targets.filter((_, i) => i !== idx);
  }
  if (targets.length >= SHOTS_PER_TURN) return targets;
  return [...targets, coord];
}

export function createInitialHuntState(): HuntState {
  return { mode: 'search', unsunkHits: [], direction: null, anchor: null };
}

export function getUnshotCells(radar: RadarBoard): Coordinate[] {
  const cells: Coordinate[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (radar[row][col].shot === 'none') cells.push({ row, col });
    }
  }
  return cells;
}

export function getCheckerboardCandidates(radar: RadarBoard): Coordinate[] {
  const unshot = getUnshotCells(radar);
  const checker = unshot.filter((c) => (c.row + c.col) % 2 === 0);
  return checker.length > 0 ? checker : unshot;
}

export function getOrthogonalNeighbors(coord: Coordinate): Coordinate[] {
  return [
    { row: coord.row - 1, col: coord.col },
    { row: coord.row + 1, col: coord.col },
    { row: coord.row, col: coord.col - 1 },
    { row: coord.row, col: coord.col + 1 },
  ].filter(isInBounds);
}

export function totalFleetCells(ships: Ship[]): number {
  return ships.reduce((sum, s) => sum + s.length, 0);
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function getShipAt(board: Board, ships: Ship[], coord: Coordinate): Ship | null {
  const id = board[coord.row]?.[coord.col]?.shipId;
  if (!id) return null;
  return ships.find((s) => s.id === id) ?? null;
}

export function isCellSunk(board: Board, ships: Ship[], coord: Coordinate): boolean {
  const ship = getShipAt(board, ships, coord);
  return ship?.sunk ?? false;
}

export { SHOTS_PER_TURN };
