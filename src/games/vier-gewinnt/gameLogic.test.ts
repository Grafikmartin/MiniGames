import { describe, expect, it } from 'vitest';
import {
  COLS,
  createEmptyBoard,
  dropDisc,
  findBestMove,
  findWinningColumns,
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
    // Computer hat drei in einer Reihe unten: Spalten 0,1,2
    place(board, 0, 'computer');
    place(board, 1, 'computer');
    place(board, 2, 'computer');
    // Füller, damit nicht nur Mitte attraktiv ist
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
    /*
      Situation: Wenn Computer in Spalte 3 setzt, landet er auf Höhe 1 und
      öffnet dem Spieler darüber/daneben einen Gewinn – konstruiert als:
      Spieler hat drei horizontal auf Reihe 5 (unten) in Spalten 1,2,4 mit Lücke 3.
      Computer darf nicht die Lücke ignorieren – Block hat Vorrang.
      Separater Fall: Zug in Spalte X lässt Spieler gewinnen.
    */
    // Unten: P P _ P  → Block Spalte 2 ist Pflicht
    place(board, 0, 'player');
    place(board, 1, 'player');
    place(board, 3, 'player');
    place(board, 6, 'computer');

    const move = findBestMove(board, 'hard');
    expect(move).toBe(2);
  });

  it('vermeidet einen Zug, der dem Spieler danach den Gewinn freigibt', () => {
    const board = createEmptyBoard();
    // Aufbau: drei Spielersteine vertikal in Spalte 1 (Reihen 5,4,3), Spalte 1 Reihe 2 leer.
    // Wenn Computer irgendwo spielt und NICHT Spalte 1 blockt, gewinnt Spieler.
    // Zusätzlich: Spalte 0 so füllen, dass Computer dort "verlockend" wirkt aber
    // nach dem Zug Spieler in Spalte 1 gewinnt – Block muss trotzdem kommen.
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
    /*
      Brett (unten = Reihe 5):
      Spalte: 0 1 2 3 4 5 6
      Wenn Computer in 3 setzt und darunter schon Struktur ist...

      Einfacherer Fall: Spieler hat 2er, Computer könnte Mitte nehmen
      und dabei eine Lücke öffnen – wir prüfen, dass nach dem Zug
      der Spieler keinen Sofortgewinn hat.
    */
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
