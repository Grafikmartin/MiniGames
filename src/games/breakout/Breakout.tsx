import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FullscreenButton } from '../../components/FullscreenButton';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { BreakoutControls } from './BreakoutControls';
import { BreakoutHelp } from './BreakoutHelp';
import { BreakoutHud } from './BreakoutHud';
import { BreakoutMenu } from './BreakoutMenu';
import { useBreakoutGame } from './useBreakoutGame';
import './Breakout.css';
import './BreakoutHelp.css';

export function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    phase,
    settings,
    score,
    lives,
    levelIndex,
    highscore,
    showHelp,
    statusMessage,
    levelName,
    saveSettings,
    startGame,
    launch,
    togglePause,
    backToMenu,
    setShowHelp,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handlePointerLeave,
    setTouchButton,
  } = useBreakoutGame(canvasRef);

  const inGame = phase !== 'menu';
  const showTouchControls =
    inGame && phase !== 'paused' && phase !== 'gameOver' && phase !== 'levelComplete';

  return (
    <div className="bo-wrapper">
      <div className="bo-top-bar">
        <FullscreenButton />
      </div>

      {phase === 'menu' && (
        <BreakoutMenu
          settings={settings}
          highscore={highscore}
          onStart={startGame}
          onHelp={() => setShowHelp(true)}
          onModeChange={(mode) => saveSettings({ ...settings, mode })}
          onSoundToggle={() => saveSettings({ ...settings, soundOn: !settings.soundOn })}
        />
      )}

      {inGame && (
        <>
          <BreakoutHud
            score={score}
            highscore={highscore}
            lives={lives}
            levelIndex={levelIndex}
            levelName={levelName}
            mode={settings.mode}
            phase={phase}
            statusMessage={statusMessage}
            onPause={togglePause}
          />

          <div className="bo-console">
            <canvas
              ref={canvasRef}
              className="bo-canvas"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-label="Breakout Spielfeld"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                handlePointerDown(e.clientX);
              }}
              onPointerMove={(e) => handlePointerMove(e.clientX)}
              onPointerLeave={handlePointerLeave}
              onPointerUp={(e) => {
                e.preventDefault();
                handlePointerUp();
              }}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={handlePointerUp}
            />

            {phase === 'paused' && (
              <div className="bo-overlay">
                <h2>PAUSIERT</h2>
                <button type="button" className="bo-btn" onClick={togglePause}>
                  WEITER
                </button>
              </div>
            )}

            {phase === 'levelComplete' && (
              <div className="bo-overlay">
                <h2>LEVEL GESCHAFFT</h2>
                <p>{statusMessage}</p>
              </div>
            )}

            {phase === 'gameOver' && (
              <div className="bo-overlay">
                <h2>GAME OVER</h2>
                <p>PUNKTE: {score}</p>
                <p>HI: {highscore}</p>
                <p>{statusMessage}</p>
                <button type="button" className="bo-btn" onClick={startGame}>
                  NOCH EINMAL
                </button>
                <button type="button" className="bo-btn bo-btn--ghost" onClick={backToMenu}>
                  MENÜ
                </button>
              </div>
            )}
          </div>

          <BreakoutControls
            visible={showTouchControls}
            onLeft={(p) => setTouchButton('left', p)}
            onRight={(p) => setTouchButton('right', p)}
          />

          {phase === 'ready' && (
            <button type="button" className="bo-btn bo-launch-btn" onClick={launch}>
              BALL STARTEN
            </button>
          )}

          <p className="bo-hint">
            {phase === 'playing'
              ? 'Pfeiltasten / A·D · Maus · Touch'
              : phase === 'ready'
                ? 'Leertaste · Enter · Tippen'
                : '\u00a0'}
          </p>
        </>
      )}

      {showHelp && <BreakoutHelp onClose={() => setShowHelp(false)} />}

      {phase === 'menu' && (
        <Link to="/" className="bo-back-link">
          ZURÜCK
        </Link>
      )}
    </div>
  );
}
