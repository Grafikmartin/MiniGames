import { describe, expect, it } from 'vitest';
import { createInitialHuntState, pickAiShots, updateHuntState } from './battleshipAI';
import { PLACEMENT_ORDER, SHIP_LENGTHS, SHOTS_PER_TURN } from './constants';
import {
  allShipsSunk,
  applyShot,
  canPlaceShip,
  createEmptyBoard,
  createEmptyRadar,
  createShip,
  isAlreadyShot,
  placeShipOnBoard,
  randomPlacement,
  toggleOrientation,
  toggleTarget,
  totalFleetCells,
} from './gameLogic';

describe('Schiffsplatzierung', () => {
  it('platziert ein Schiff gültig', () => {
    const board = createEmptyBoard();
    expect(canPlaceShip(board, { row: 0, col: 0 }, 5, 'horizontal')).toBe(true);
    const ship = createShip('battleship', { row: 0, col: 0 }, 'horizontal');
    const next = placeShipOnBoard(board, ship);
    expect(next[0][0].shipId).toBe(ship.id);
    expect(next[0][4].shipId).toBe(ship.id);
  });

  it('verhindert Platzierung außerhalb', () => {
    const board = createEmptyBoard();
    expect(canPlaceShip(board, { row: 0, col: 8 }, 5, 'horizontal')).toBe(false);
    expect(canPlaceShip(board, { row: 9, col: 0 }, 2, 'vertical')).toBe(false);
  });

  it('verhindert Überschneidung', () => {
    let board = createEmptyBoard();
    const ship = createShip('cruiser', { row: 0, col: 0 }, 'horizontal');
    board = placeShipOnBoard(board, ship);
    expect(canPlaceShip(board, { row: 0, col: 1 }, 3, 'horizontal')).toBe(false);
  });

  it('dreht Ausrichtung', () => {
    expect(toggleOrientation('horizontal')).toBe('vertical');
    expect(toggleOrientation('vertical')).toBe('horizontal');
  });

  it('platziert zufällig alle 17 Felder', () => {
    const { ships } = randomPlacement();
    expect(ships).toHaveLength(PLACEMENT_ORDER.length);
    expect(totalFleetCells(ships)).toBe(17);
  });
});

describe('Schüsse', () => {
  it('erkennt Treffer', () => {
    const ship = createShip('submarine', { row: 2, col: 2 }, 'horizontal');
    let board = placeShipOnBoard(createEmptyBoard(), ship);
    const result = applyShot(board, [ship], { row: 2, col: 2 });
    expect(result.result.hit).toBe(true);
    expect(result.ships[0].hits).toBe(1);
  });

  it('erkennt versenktes Schiff', () => {
    const ship = createShip('submarine', { row: 2, col: 2 }, 'horizontal');
    let board = placeShipOnBoard(createEmptyBoard(), ship);
    let ships = [ship];
    let r = applyShot(board, ships, { row: 2, col: 2 });
    board = r.board;
    ships = r.ships;
    r = applyShot(board, ships, { row: 2, col: 3 });
    expect(r.result.sunk).toBe(true);
    expect(allShipsSunk(r.ships)).toBe(true);
  });

  it('verhindert Doppelschuss', () => {
    const radar = createEmptyRadar();
    radar[1][1].shot = 'miss';
    expect(isAlreadyShot(radar, { row: 1, col: 1 })).toBe(true);
  });

  it('erlaubt maximal drei Schüsse pro Zug', () => {
    const radar = createEmptyRadar();
    let targets = toggleTarget([], { row: 0, col: 0 }, radar);
    targets = toggleTarget(targets, { row: 0, col: 1 }, radar);
    targets = toggleTarget(targets, { row: 0, col: 2 }, radar);
    expect(targets).toHaveLength(SHOTS_PER_TURN);
    targets = toggleTarget(targets, { row: 0, col: 3 }, radar);
    expect(targets).toHaveLength(SHOTS_PER_TURN);
  });

  it('beendet Spiel nach 17 Treffern', () => {
    const { board, ships } = randomPlacement();
    let currentBoard = board;
    let currentShips = ships;
    let hits = 0;
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const r = applyShot(currentBoard, currentShips, { row, col });
        currentBoard = r.board;
        currentShips = r.ships;
        if (r.result.hit) hits++;
        if (allShipsSunk(currentShips)) break;
      }
      if (allShipsSunk(currentShips)) break;
    }
    expect(hits).toBe(17);
    expect(allShipsSunk(currentShips)).toBe(true);
  });
});

describe('KI', () => {
  it('wählt keine beschossenen Felder', () => {
    const radar = createEmptyRadar();
    radar[0][0].shot = 'miss';
    const { shots } = pickAiShots(radar, createInitialHuntState(), 3, () => 0);
    expect(shots.every((s) => !(s.row === 0 && s.col === 0))).toBe(true);
  });

  it('wechselt nach Treffer in Jagdmodus', () => {
    const radar = createEmptyRadar();
    radar[3][3].shot = 'hit';
    const hunt = updateHuntState(createInitialHuntState(), [{ coord: { row: 3, col: 3 }, hit: true, sunk: false, shipId: 'x' }], radar);
    expect(hunt.mode).toBe('hunt');
  });

  it('schießt nach Treffer auf benachbarte Felder', () => {
    const radar = createEmptyRadar();
    radar[3][3].shot = 'hit';
    const hunt = updateHuntState(createInitialHuntState(), [{ coord: { row: 3, col: 3 }, hit: true, sunk: false, shipId: 'x' }], radar);
    const { shots } = pickAiShots(radar, hunt, 1, () => 0);
    expect(shots).toHaveLength(1);
    const s = shots[0];
    const adjacent =
      (Math.abs(s.row - 3) === 1 && s.col === 3) || (Math.abs(s.col - 3) === 1 && s.row === 3);
    expect(adjacent).toBe(true);
  });

  it('vervollständigt eine Schiffslinie zwischen zwei Treffern', () => {
    const radar = createEmptyRadar();
    radar[3][3].shot = 'hit';
    radar[3][5].shot = 'hit';
    const hunt = updateHuntState(createInitialHuntState(), [], radar);
    const { shots } = pickAiShots(radar, hunt, 1, () => 0);
    expect(shots[0]).toEqual({ row: 3, col: 4 });
  });

  it('behält Jagdmodus nach versenktem Schiff wenn andere Treffer offen sind', () => {
    const radar = createEmptyRadar();
    radar[8][8].shot = 'hit';
    radar[3][3].shot = 'sunk';
    let hunt = updateHuntState(
      createInitialHuntState(),
      [{ coord: { row: 3, col: 3 }, hit: true, sunk: true, shipId: 'a' }],
      radar,
    );
    expect(hunt.mode).toBe('hunt');
    expect(hunt.unsunkHits).toEqual([{ row: 8, col: 8 }]);
    const { shots } = pickAiShots(radar, hunt, 1, () => 0);
    const s = shots[0];
    const adjacent =
      (Math.abs(s.row - 8) === 1 && s.col === 8) || (Math.abs(s.col - 8) === 1 && s.row === 8);
    expect(adjacent).toBe(true);
  });
});

describe('Flottengrößen', () => {
  it('summiert korrekt', () => {
    const total = PLACEMENT_ORDER.reduce((sum, t) => sum + SHIP_LENGTHS[t], 0);
    expect(total).toBe(17);
  });
});
