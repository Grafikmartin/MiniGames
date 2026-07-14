import { useRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { useSpaceInvadersGame } from './useSpaceInvadersGame';
import './SpaceInvaders.css';

function ControlButton({
  label,
  ariaLabel,
  onPointerDown,
  onPointerUp,
}: {
  label: string;
  ariaLabel: string;
  onPointerDown: () => void;
  onPointerUp: () => void;
}) {
  return (
    <button
      className="si-ctrl-btn"
      aria-label={ariaLabel}
      onPointerDown={(e) => { e.preventDefault(); onPointerDown(); }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {label}
    </button>
  );
}

export function SpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    overlay,
    waveMsg,
    showWaveOverlay,
    score,
    lives,
    level,
    highscore,
    paused,
    soundEnabled,
    musicPlaying,
    isFullscreen,
    startGame,
    restartGame,
    togglePause,
    toggleSound,
    toggleMusic,
    enterFullscreen,
    exitFullscreen,
    bindKey,
  } = useSpaceInvadersGame(canvasRef);

  return (
    <div className="si-wrapper">
      <div className="si-top-controls">
        <span className="material-icons si-ctrl-icon" title="Pause/Resume" onClick={togglePause}>
          {paused ? 'play_arrow' : 'pause'}
        </span>
        {!isFullscreen ? (
          <span className="material-icons si-ctrl-icon" title="Fullscreen" onClick={enterFullscreen}>
            fullscreen
          </span>
        ) : (
          <span className="material-icons si-ctrl-icon" title="Exit fullscreen" onClick={exitFullscreen}>
            fullscreen_exit
          </span>
        )}
        <span className="material-icons si-ctrl-icon" title="Sound On/Off" onClick={toggleSound}>
          {soundEnabled ? 'volume_off' : 'volume_up'}
        </span>
        <span className="material-icons si-ctrl-icon" title="Play Music" onClick={toggleMusic}>
          {musicPlaying ? 'music_off' : 'music_note'}
        </span>
      </div>

      <div className="si-console">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {overlay === 'start' && (
          <div className="si-overlay si-start">
            <h1 className="si-title">
              <span>SPACE</span>
              <br />
              <span>INVADERS</span>
            </h1>
            <button onClick={startGame} onPointerDown={startGame}>START</button>
          </div>
        )}

        {showWaveOverlay && (
          <div className="si-overlay">
            <h1>{waveMsg}</h1>
          </div>
        )}

        {overlay === 'gameOver' && (
          <div className="si-overlay">
            <h1>GAME OVER</h1>
            <button onClick={restartGame} onPointerDown={restartGame}>RESTART</button>
          </div>
        )}

        {overlay === 'win' && (
          <div className="si-overlay">
            <h1>YOU WIN!</h1>
            <button onClick={restartGame} onPointerDown={restartGame}>RESTART</button>
          </div>
        )}

        <div className="si-hud">
          <div className="si-hud-left">
            <span>HI: {highscore}</span>
            <span>SCORE: {score}</span>
          </div>
          <span>LIVES: {lives}</span>
          <span>WAVE {level}</span>
        </div>
      </div>

      <div className="si-controls">
        <ControlButton
          label="◄"
          ariaLabel="Left"
          onPointerDown={() => bindKey('ArrowLeft', true)}
          onPointerUp={() => bindKey('ArrowLeft', false)}
        />
        <ControlButton
          label="⨀"
          ariaLabel="Fire"
          onPointerDown={() => bindKey(' ', true)}
          onPointerUp={() => bindKey(' ', false)}
        />
        <ControlButton
          label="►"
          ariaLabel="Right"
          onPointerDown={() => bindKey('ArrowRight', true)}
          onPointerUp={() => bindKey('ArrowRight', false)}
        />
      </div>
    </div>
  );
}
