import { useRef } from 'react';
import { useSnakeGame } from './useSnakeGame';
import './Snake.css';

function DirButton({
  label,
  ariaLabel,
  onClick,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      className="snake-dir-btn"
      aria-label={ariaLabel}
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
    >
      {label}
    </button>
  );
}

export function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const {
    score,
    highscore,
    paused,
    isFullscreen,
    attemptTurn,
    togglePause,
    restart,
    handleCanvasClick,
    handleTouchStart,
    handleTouchEnd,
    enterFullscreen,
    exitFullscreen,
  } = useSnakeGame(canvasRef, consoleRef);

  return (
    <div className="snake-wrapper">
      <div className="snake-header">
        <div className="snake-hud">
          <span>SCORE: {score}</span>
          <span>HI: {highscore}</span>
        </div>

        <div className="snake-top-controls">
          <span className="material-icons snake-ctrl-icon" title="Neustart" onClick={restart}>
            restart_alt
          </span>
          <span className="material-icons snake-ctrl-icon" title="Pause/Resume" onClick={togglePause}>
            {paused ? 'play_arrow' : 'pause'}
          </span>
          {!isFullscreen ? (
            <span className="material-icons snake-ctrl-icon" title="Fullscreen" onClick={enterFullscreen}>
              fullscreen
            </span>
          ) : (
            <span className="material-icons snake-ctrl-icon" title="Exit fullscreen" onClick={exitFullscreen}>
              fullscreen_exit
            </span>
          )}
        </div>
      </div>

      <div className="snake-console" ref={consoleRef}>
        <canvas
          ref={canvasRef}
          className="snake-canvas"
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <p className="snake-hint-desktop">
        Am PC: Cursor-Tasten (↑ ↓ ← →) – nicht Maus oder Touchpad
      </p>

      <div className="snake-touch-controls">
        <DirButton label="▲" ariaLabel="Up" onClick={() => attemptTurn(0, -1, 'y')} />
        <div className="snake-touch-row">
          <DirButton label="◄" ariaLabel="Left" onClick={() => attemptTurn(-1, 0, 'x')} />
          <DirButton label="►" ariaLabel="Right" onClick={() => attemptTurn(1, 0, 'x')} />
        </div>
        <DirButton label="▼" ariaLabel="Down" onClick={() => attemptTurn(0, 1, 'y')} />
      </div>
    </div>
  );
}
