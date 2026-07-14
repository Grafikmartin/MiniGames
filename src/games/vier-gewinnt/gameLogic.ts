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

export function findBestMove(board: Board): number {
  const computer: Mark = 'computer';
  const player: Mark = 'player';

  for (let col = 0; col < COLS; col++) {
    const row = dropDisc(board, col);
    if (row !== null) {
      board[row][col] = computer;
      if (checkWin(board, row, col, computer)) {
        board[row][col] = null;
        return col;
      }
      board[row][col] = null;
    }
  }

  for (let col = 0; col < COLS; col++) {
    const row = dropDisc(board, col);
    if (row !== null) {
      board[row][col] = player;
      if (checkWin(board, row, col, player)) {
        board[row][col] = null;
        return col;
      }
      board[row][col] = null;
    }
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

  let randomCol: number;
  do {
    randomCol = Math.floor(Math.random() * COLS);
  } while (dropDisc(board, randomCol) === null);
  return randomCol;
}
