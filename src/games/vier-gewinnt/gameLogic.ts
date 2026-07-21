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

/** Zelle ist leer und per Schwerkraft in diesem Zug bespielbar. */
export function isDropTarget(board: Board, row: number, col: number): boolean {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  return board[row][col] === null && dropDisc(board, col) === row;
}

export interface OpenTwoThreat {
  /** Spielbare End-Spalten, die den Zweier blocken/erweitern. */
  endCols: number[];
  /** Anzahl spielbarer Enden (1 oder 2). */
  playableEnds: number;
  /** Beide Enden frei und spielbar → Vorstufe zur Fork-Gefahr. */
  doubleOpen: boolean;
}

const OPEN_TWO_DIRS = [
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 1, c: 1 },
  { r: 1, c: -1 },
] as const;

/**
 * Findet offene Zweier von `mark`: zwei benachbarte Steine mit mind. einem
 * spielbaren freien Ende (Schwerkraft beachten). Horizontal, vertikal, Diagonalen.
 *
 * Muster z. B. `. X X .` – ungebremst oft Vorstufe zu offenem Dreier und Fork.
 */
export function findOpenTwoThreats(board: Board, mark: Mark): OpenTwoThreat[] {
  const threats: OpenTwoThreat[] = [];
  const seen = new Set<string>();

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== mark) continue;

      for (const { r, c } of OPEN_TWO_DIRS) {
        const row2 = row + r;
        const col2 = col + c;
        if (row2 < 0 || row2 >= ROWS || col2 < 0 || col2 >= COLS) continue;
        if (board[row2][col2] !== mark) continue;

        // Jedes Paar nur einmal (Startzelle ist „früher“ in Scan-Richtung)
        const prevRow = row - r;
        const prevCol = col - c;
        if (
          prevRow >= 0 && prevRow < ROWS &&
          prevCol >= 0 && prevCol < COLS &&
          board[prevRow][prevCol] === mark
        ) {
          continue;
        }

        const endA = { row: row - r, col: col - c };
        const endB = { row: row2 + r, col: col2 + c };
        const playableEnds = [endA, endB].filter((end) =>
          isDropTarget(board, end.row, end.col),
        );

        if (playableEnds.length === 0) continue;

        // Genug Raum für einen Dreier: mind. ein spielbares Ende verlängert den Zweier.
        const endCols = [...new Set(playableEnds.map((e) => e.col))];
        const key = `${row},${col},${r},${c}`;
        if (seen.has(key)) continue;
        seen.add(key);

        threats.push({
          endCols,
          playableEnds: playableEnds.length,
          doubleOpen: playableEnds.length >= 2,
        });
      }
    }
  }

  return threats;
}

/** Spalten, die mindestens einen offenen Zweier von `mark` blockieren. */
export function findOpenTwoBlockColumns(board: Board, mark: Mark): number[] {
  const cols = new Set<number>();
  for (const threat of findOpenTwoThreats(board, mark)) {
    for (const col of threat.endCols) cols.add(col);
  }
  return [...cols];
}

/**
 * Schwer: gewinnt/blockt sofort, blockt offene Zweier früh, vermeidet Züge die dem
 * Spieler einen 4er ermöglichen, baut eigene Drohungen auf.
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

  const playerOpenTwos = findOpenTwoThreats(board, player);
  const openTwoBlockCols = new Set(playerOpenTwos.flatMap((t) => t.endCols));
  const doubleOpenBlockCols = new Set(
    playerOpenTwos.filter((t) => t.doubleOpen).flatMap((t) => t.endCols),
  );

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

    // Offene Zweier des Gegners blocken (vor offenem Dreier / Fork)
    if (doubleOpenBlockCols.has(col)) {
      score += 6_000;
    } else if (openTwoBlockCols.has(col)) {
      score += 3_500;
    }

    // Nach dem Zug: verbleibende offene Zweier des Spielers bestrafen
    const remainingPlayerTwos = findOpenTwoThreats(board, player);
    for (const threat of remainingPlayerTwos) {
      score -= threat.doubleOpen ? 4_500 : 2_200;
    }

    // Eigene offene Zweier belohnen (Druck aufbauen)
    const ownTwos = findOpenTwoThreats(board, computer);
    for (const threat of ownTwos) {
      score += threat.doubleOpen ? 1_800 : 700;
    }

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
