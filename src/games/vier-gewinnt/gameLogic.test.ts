import { describe, expect, it } from 'vitest';
import {
  COLS,
  createEmptyBoard,
  dropDisc,
  findBestMove,
  findOpenTwoBlockColumns,
  findOpenTwoThreats,
  findWinningColumns,
  isDropTarget,
  wouldWinAt,
  type Board,
  type Mark,
} from './gameLogic';

function place(board: Board, col: number, mark: Mark) {
  const row = dropDisc(board, col);
  if (row === null) throw new Error(`Spalte ${col} voll`);
  board[row][col] = mark;
  return row;
}

describe('Vier gewinnt KI', () => {
  it('gewinnt im Schwer-Modus, wenn ein 4er möglich ist', () => {
    const board = createEmptyBoard();
    place(board, 0, 'computer');
    place(board, 1, 'computer');
    place(board, 2, 'computer');
    place(board, 6, 'player');

    expect(findBestMove(board, 'hard')).toBe(3);
  });

  it('blockt im Schwer-Modus einen drohenden Spieler-4er', () => {
    const board = createEmptyBoard();
    place(board, 0, 'player');
    place(board, 1, 'player');
    place(board, 2, 'player');
    place(board, 6, 'computer');

    expect(findBestMove(board, 'hard')).toBe(3);
  });

  it('vermeidet im Schwer-Modus Züge, die dem Spieler einen Sofort-4er geben', () => {
    const board = createEmptyBoard();
    place(board, 0, 'player');
    place(board, 1, 'player');
    place(board, 3, 'player');
    place(board, 6, 'computer');

    expect(findBestMove(board, 'hard')).toBe(2);
  });

  it('vermeidet einen Zug, der dem Spieler danach den Gewinn freigibt', () => {
    const board = createEmptyBoard();
    place(board, 1, 'player');
    place(board, 1, 'player');
    place(board, 1, 'player');
    place(board, 0, 'computer');
    place(board, 0, 'computer');

    expect(findBestMove(board, 'hard')).toBe(1);
  });

  it('findWinningColumns erkennt Gewinnspalten', () => {
    const board = createEmptyBoard();
    place(board, 0, 'player');
    place(board, 1, 'player');
    place(board, 2, 'player');
    expect(findWinningColumns(board, 'player')).toEqual([3]);
    expect(wouldWinAt(board, 3, 'player')).toBe(true);
    expect(wouldWinAt(board, 4, 'player')).toBe(false);
  });

  it('Normal-Modus blockt ebenfalls Sofort-Gewinne', () => {
    const board = createEmptyBoard();
    place(board, 0, 'player');
    place(board, 1, 'player');
    place(board, 2, 'player');
    expect(findBestMove(board, 'normal')).toBe(3);
  });

  it('Schwer wählt unter sicheren Zügen kein Setup für den Gegner', () => {
    const board = createEmptyBoard();
    place(board, 2, 'player');
    place(board, 4, 'player');
    place(board, 3, 'computer');
    place(board, 5, 'computer');

    const move = findBestMove(board, 'hard');
    const row = dropDisc(board, move);
    expect(row).not.toBeNull();
    board[row!][move] = 'computer';

    for (let col = 0; col < COLS; col++) {
      expect(wouldWinAt(board, col, 'player')).toBe(false);
    }
  });
});

describe('Offene Zweier', () => {
  it('erkennt horizontales Muster . X X . mit beiden spielbaren Enden', () => {
    const board = createEmptyBoard();
    place(board, 1, 'player');
    place(board, 2, 'player');

    expect(isDropTarget(board, 5, 0)).toBe(true);
    expect(isDropTarget(board, 5, 3)).toBe(true);

    const threats = findOpenTwoThreats(board, 'player');
    expect(threats.some((t) => t.doubleOpen)).toBe(true);
    expect(findOpenTwoBlockColumns(board, 'player').sort()).toEqual([0, 3]);
  });

  it('blockt im Schwer-Modus mindestens ein Ende eines offenen Zweiers', () => {
    const board = createEmptyBoard();
    place(board, 1, 'player');
    place(board, 2, 'player');
    place(board, 5, 'computer');
    place(board, 6, 'computer');

    const move = findBestMove(board, 'hard');
    expect([0, 3]).toContain(move);
  });

  it('blockt offenen Zweier auch wenn die Mitte verlockend wäre', () => {
    const board = createEmptyBoard();
    place(board, 2, 'player');
    place(board, 3, 'player');
    place(board, 6, 'computer');

    const move = findBestMove(board, 'hard');
    expect([1, 4]).toContain(move);
  });

  it('erkennt diagonalen offenen Zweier', () => {
    const board = createEmptyBoard();
    // Diagonale: P(5,0) – P(4,1), spielbares Ende bei (3,2)
    place(board, 0, 'player');
    place(board, 1, 'computer');
    place(board, 1, 'player');
    place(board, 2, 'computer');
    place(board, 2, 'computer');
    expect(isDropTarget(board, 3, 2)).toBe(true);

    const threats = findOpenTwoThreats(board, 'player');
    expect(threats.length).toBeGreaterThan(0);
    expect(findOpenTwoBlockColumns(board, 'player')).toContain(2);
  });

  it('ignoriert Enden ohne Schwerkraft-Treffer', () => {
    const board = createEmptyBoard();
    place(board, 1, 'computer');
    place(board, 2, 'computer');
    place(board, 1, 'player');
    place(board, 2, 'player');
    // P P liegen auf Reihe 4; Enden 0/3 auf Reihe 4 sind nicht dropbar
    const floating = findOpenTwoThreats(board, 'player').find(
      (t) => t.doubleOpen && t.endCols.includes(0) && t.endCols.includes(3),
    );
    expect(floating).toBeUndefined();
  });
});
