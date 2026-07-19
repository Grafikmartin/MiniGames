import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DIFFICULTY_LABELS,
  checkWin,
  createEmptyBoard,
  dropDisc,
  findBestMove,
  isBoardFull,
  type Board,
  type Difficulty,
  type Mark,
} from './gameLogic';
import { vgSound, unlockAudio } from './sound';
import { PlayerMark } from './PlayerMark';
import { PixelSprite } from '../../components/PixelSprite';
import { LEGEND_PIXEL, markSprites, STATUS_PIXEL } from './markSprites';
import './VierGewinnt.css';

function StatusText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer) {
      parts.push(buffer);
      buffer = '';
    }
  };

  for (const char of text) {
    if (char === '○') {
      flush();
      parts.push(
        <span key={parts.length} className="vg-status-mark" aria-hidden>
          <PixelSprite sprite={markSprites.player} pixelSize={STATUS_PIXEL} />
        </span>,
      );
    } else if (char === '⨯') {
      flush();
      parts.push(
        <span key={parts.length} className="vg-status-mark" aria-hidden>
          <PixelSprite sprite={markSprites.computer} pixelSize={STATUS_PIXEL} />
        </span>,
      );
    } else {
      buffer += char;
    }
  }
  flush();

  return <>{parts}</>;
}

type Phase = 'idle' | 'playing' | 'ended';

interface MoveResult {
  board: Board;
  row: number;
  col: number;
  ended: boolean;
}

function computeMove(prev: Board, col: number, mark: Mark): MoveResult | null {
  const row = dropDisc(prev, col);
  if (row === null) return null;

  const next = prev.map((r) => [...r]);
  next[row][col] = mark;

  const won = checkWin(next, row, col, mark);
  const full = isBoardFull(next);

  return { board: next, row, col, ended: won || full };
}

export function VierGewinnt() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [status, setStatus] = useState('Klicke START.');
  const [phase, setPhase] = useState<Phase>('idle');
  const [animatedCell, setAnimatedCell] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const boardRef = useRef(board);
  const difficultyRef = useRef(difficulty);
  const computerTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const turnIdRef = useRef(0);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  const playDropSound = useCallback((mark: Mark) => {
    unlockAudio();
    if (mark === 'player') vgSound.playerDrop();
    else vgSound.computerDrop();
  }, []);

  const playWinSound = useCallback(() => {
    unlockAudio();
    vgSound.win();
  }, []);

  const finishMove = useCallback((result: MoveResult, mark: Mark) => {
    setAnimatedCell(`${result.row}-${result.col}`);
    playDropSound(mark);

    if (checkWin(result.board, result.row, result.col, mark)) {
      setPhase('ended');
      setStatus(mark === 'player' ? 'Gewonnen! Vier ○ in einer Reihe.' : 'Verloren! Computer hat vier ⨯.');
      if (mark === 'player') playWinSound();
      return;
    }

    if (isBoardFull(result.board)) {
      setPhase('ended');
      setStatus('Unentschieden – Brett voll.');
    }
  }, [playDropSound, playWinSound]);

  const runComputerTurn = useCallback(() => {
    const turnId = turnIdRef.current;
    setInputLocked(true);
    setIsPlayerTurn(false);
    setStatus('Computer (⨯) ist dran…');

    computerTimeoutRef.current = setTimeout(() => {
      if (turnId !== turnIdRef.current) return;

      const col = findBestMove(boardRef.current.map((r) => [...r]), difficultyRef.current);
      const result = computeMove(boardRef.current, col, 'computer');
      if (!result) {
        setInputLocked(false);
        return;
      }

      boardRef.current = result.board;
      setBoard(result.board);
      finishMove(result, 'computer');

      if (!result.ended) {
        setIsPlayerTurn(true);
        setStatus('Du (○) bist dran.');
      }
      setInputLocked(false);
    }, 500);
  }, [finishMove]);

  const handleColumnPlay = useCallback((col: number) => {
    if (phase !== 'playing' || inputLocked || !isPlayerTurn) return;

    const result = computeMove(boardRef.current, col, 'player');
    if (!result) {
      setStatus('Diese Spalte ist voll.');
      return;
    }

    setInputLocked(true);
    boardRef.current = result.board;
    setBoard(result.board);
    finishMove(result, 'player');

    if (result.ended) {
      setInputLocked(false);
      return;
    }

    runComputerTurn();
  }, [finishMove, inputLocked, isPlayerTurn, phase, runComputerTurn]);

  const startGame = useCallback(() => {
    turnIdRef.current += 1;
    clearTimeout(computerTimeoutRef.current);

    const empty = createEmptyBoard();
    boardRef.current = empty;
    setBoard(empty);
    setPhase('playing');
    setAnimatedCell(null);
    setInputLocked(false);

    if (Math.random() < 0.5) {
      runComputerTurn();
    } else {
      setIsPlayerTurn(true);
      setStatus('Du (○) beginnst – wähle eine Spalte.');
    }
  }, [runComputerTurn]);

  const resetGame = useCallback(() => {
    turnIdRef.current += 1;
    clearTimeout(computerTimeoutRef.current);
    const empty = createEmptyBoard();
    boardRef.current = empty;
    setPhase('idle');
    setBoard(empty);
    setStatus('Klicke START.');
    setAnimatedCell(null);
    setInputLocked(false);
    setIsPlayerTurn(true);
  }, []);

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);

    return () => {
      turnIdRef.current += 1;
      clearTimeout(computerTimeoutRef.current);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  return (
    <div className="vg-wrapper">
      <div className="vg-header">
        <div className="vg-legend">
          <span>
            <span className="vg-legend-icon">
              <PixelSprite sprite={markSprites.player} pixelSize={LEGEND_PIXEL} />
            </span>
            Du
          </span>
          <span>
            <span className="vg-legend-icon">
              <PixelSprite sprite={markSprites.computer} pixelSize={LEGEND_PIXEL} />
            </span>
            PC
          </span>
        </div>
        <div className="vg-controls">
          {!isFullscreen ? (
            <span className="material-icons vg-ctrl-icon" title="Fullscreen" onClick={enterFullscreen}>
              fullscreen
            </span>
          ) : (
            <span className="material-icons vg-ctrl-icon" title="Exit fullscreen" onClick={exitFullscreen}>
              fullscreen_exit
            </span>
          )}
        </div>
      </div>

      <div className="vg-console">
        <div className="vg-board" role="grid" aria-label="Vier gewinnt Spielfeld">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                className="vg-cell"
                disabled={phase !== 'playing' || inputLocked || !isPlayerTurn}
                onClick={() => handleColumnPlay(colIndex)}
                aria-label={`Spalte ${colIndex + 1}, Zeile ${rowIndex + 1}`}
              >
                {cell && (
                  <PlayerMark
                    mark={cell}
                    animate={animatedCell === `${rowIndex}-${colIndex}`}
                  />
                )}
              </button>
            )),
          )}
        </div>
      </div>

      <p className="vg-status"><StatusText text={status} /></p>

      {(phase === 'idle' || phase === 'ended') && (
        <div className="vg-difficulty" role="group" aria-label="Schwierigkeit">
          <span className="vg-difficulty-label">Schwierigkeit</span>
          <div className="vg-difficulty-btns">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((level) => (
              <button
                key={level}
                type="button"
                className={`vg-diff-btn${difficulty === level ? ' vg-diff-btn--active' : ''}`}
                aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}
              >
                {DIFFICULTY_LABELS[level].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vg-actions">
        {phase === 'idle' || phase === 'ended' ? (
          <button type="button" className="vg-btn" onClick={startGame}>
            {phase === 'ended' ? 'NOCHMAL' : 'START'}
          </button>
        ) : (
          <button type="button" className="vg-btn vg-btn--ghost" onClick={resetGame}>
            ABBRECHEN
          </button>
        )}
      </div>
    </div>
  );
}
