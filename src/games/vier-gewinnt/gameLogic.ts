export const ROWS = 6;
export const COLS = 7;

export const COLORS = {
  bg: '#000000',
  fg: '#33ff33',
  board: '#111111',
  cell: '#000000',
  border: '#555555',
} as const;

export type Mark = 'player' | 'computer';
export type Cell = Mark | null;
export type Board = Cell[][];
export type Difficulty = 'normal' | 'hard';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  normal: 'Normal',
  hard: 'Schwer',
};

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function dropDisc(board: Board, col: number): number | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!board[row][col]) return row;
  }
  return null;
}

function countDirection(
  board: Board,
  row: number,
  col: number,
  player: Mark,
  rowInc: number,
  colInc: number,
) {
  let count = 0;
  for (let i = 1; i < 4; i++) {
    const newRow = row + rowInc * i;
    const newCol = col + colInc * i;
    if (
      newRow >= 0 && newRow < ROWS &&
      newCol >= 0 && newCol < COLS &&
      board[newRow][newCol] === player
    ) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function checkWin(board: Board, row: number, col: number, player: Mark): boolean {
  const directions = [
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: -1 },
  ];

  for (const { r, c } of directions) {
    let count = 1;
    count += countDirection(board, row, col, player, r, c);
    count += countDirection(board, row, col, player, -r, -c);
    if (count >= 4) return true;
  }
  return false;
}

export function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

export function getValidColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (dropDisc(board, col) !== null) cols.push(col);
  }
  return cols;
}

/** Prüft, ob ein Stein in dieser Spalte sofort gewinnt (Brett unverändert danach). */
export function wouldWinAt(board: Board, col: number, mark: Mark): boolean {
  const row = dropDisc(board, col);
  if (row === null) return false;
  board[row][col] = mark;
  const won = checkWin(board, row, col, mark);
  board[row][col] = null;
  return won;
}

export function findWinningColumns(board: Board, mark: Mark): number[] {
  return getValidColumns(board).filter((col) => wouldWinAt(board, col, mark));
}

function findBestMoveNormal(board: Board): number {
  const computer: Mark = 'computer';
  const player: Mark = 'player';

  for (let col = 0; col < COLS; col++) {
    if (wouldWinAt(board, col, computer)) return col;
  }

  for (let col = 0; col < COLS; col++) {
    if (wouldWinAt(board, col, player)) return col;
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 2; row < ROWS; row++) {
      if (
        board[row][col] === player &&
        board[row - 1][col] === player &&
        board[row - 2][col] === player &&
        board[row - 3][col] === null
      ) {
        return col;
      }
    }
  }

  for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS - 2; col++) {
      if (board[row][col] === player && board[row][col + 1] === player) {
        if (col + 2 < COLS && board[row][col + 2] === null && dropDisc(board, col + 2) === row) {
          return col + 2;
        }
        if (col - 1 >= 0 && board[row][col - 1] === null && dropDisc(board, col - 1) === row) {
          return col - 1;
        }
      }
    }
  }

  const middle = Math.floor(COLS / 2);
  if (dropDisc(board, middle) !== null) return middle;

  const valid = getValidColumns(board);
  return valid[Math.floor(Math.random() * valid.length)] ?? middle;
}

/**
 * Bewertet, wie stark eine Stellung für `mark` nach dem Setzen auf (row,col) ist.
 * Berücksichtigt Kettenlänge und freie Enden.
 */
function scorePlacement(board: Board, row: number, col: number, mark: Mark): number {
  const directions = [
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: -1 },
  ];
  let score = 0;

  for (const { r, c } of directions) {
    const forward = countDirection(board, row, col, mark, r, c);
    const backward = countDirection(board, row, col, mark, -r, -c);
    const length = 1 + forward + backward;

    const fr = row + r * (forward + 1);
    const fc = col + c * (forward + 1);
    const br = row - r * (backward + 1);
    const bc = col - c * (backward + 1);
    const openFwd =
      fr >= 0 && fr < ROWS && fc >= 0 && fc < COLS && board[fr][fc] === null;
    const openBwd =
      br >= 0 && br < ROWS && bc >= 0 && bc < COLS && board[br][bc] === null;
    const openEnds = (openFwd ? 1 : 0) + (openBwd ? 1 : 0);

    if (length >= 3 && openEnds > 0) score += 40 * openEnds;
    else if (length === 2 && openEnds > 0) score += 12 * openEnds;
    else if (length >= 2) score += 4;
  }

  return score;
}

/**
 * Schwer: gewinnt/blockt sofort, vermeidet Züge die dem Spieler einen 4er ermöglichen,
 * baut eigene Drohungen auf und bevorzugt zentrale, druckvolle Felder.
 */
function findBestMoveHard(board: Board): number {
  const computer: Mark = 'computer';
  const player: Mark = 'player';
  const valid = getValidColumns(board);
  if (valid.length === 0) return 0;

  const winning = findWinningColumns(board, computer);
  if (winning.length > 0) return winning[0];

  const mustBlock = findWinningColumns(board, player);
  if (mustBlock.length > 0) return mustBlock[0];

  let bestCol = valid[0];
  let bestScore = -Infinity;

  for (const col of valid) {
    const row = dropDisc(board, col);
    if (row === null) continue;

    board[row][col] = computer;

    let score = 0;

    // Gegnerische 4er-Möglichkeiten nach diesem Zug → stark vermeiden
    const playerWins = findWinningColumns(board, player);
    if (playerWins.length > 0) {
      score -= 100_000 + playerWins.length * 1_000;
    }

    // Eigene Drohungen (Züge, mit denen wir im Folgeschritt gewinnen würden)
    const computerThreats = findWinningColumns(board, computer);
    score += computerThreats.length * 800;
    if (computerThreats.length >= 2) {
      score += 5_000; // Doppel-Drohung / Fork
    }

    // Zusätzlich prüfen: setzt der Spieler auf eine Spalte und öffnet uns darüber eine Chance?
    // (bereits über Threats abgedeckt)

    score += scorePlacement(board, row, col, computer);

    // Zentrum bevorzugen
    score += (3 - Math.abs(col - 3)) * 15;

    // Leicht bevorzugen, Felder nicht zu weit oben zu füllen ohne Grund
    score += (ROWS - 1 - row) * 2;

    // Gegnerische Stellung schwächen: wie gut wäre ein Spielerstein hier?
    board[row][col] = player;
    score += scorePlacement(board, row, col, player) * 0.35;
    board[row][col] = computer;

    board[row][col] = null;

    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

export function findBestMove(board: Board, difficulty: Difficulty = 'normal'): number {
  if (difficulty === 'hard') return findBestMoveHard(board);
  return findBestMoveNormal(board);
}
