import { useRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { usePingPongGame } from './usePingPongGame';
import './PingPong.css';

export function PingPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    screen,
    settings,
    paused,
    isFullscreen,
    userScore,
    aiScore,
    lives,
    survivalTime,
    speedLabel,
    highscoreLabel,
    endInfo,
    saveSettings,
    setGameMode,
    startGame,
    togglePause,
    abortGame,
    backToMenu,
    handleTouchMove,
    enterFullscreen,
    exitFullscreen,
  } = usePingPongGame(canvasRef);

  const update = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    saveSettings({ ...settings, [key]: value });
  };

  return (
    <div className="pp-wrapper">
      {screen === 'menu' && (
        <div className="pp-menu">
          <h1>PING PONG</h1>

          <div className="pp-settings-row">
            <label>
              Seite
              <select
                value={settings.userSide}
                onChange={(e) => update('userSide', e.target.value as typeof settings.userSide)}
              >
                <option value="left">Links</option>
                <option value="right">Rechts</option>
              </select>
            </label>
            <label>
              Level
              <select
                value={settings.difficulty}
                onChange={(e) => update('difficulty', e.target.value as typeof settings.difficulty)}
              >
                <option value="easy">Einfach</option>
                <option value="medium">Mittel</option>
                <option value="hard">Schwer</option>
              </select>
            </label>
          </div>

          <label className="pp-field">
            Punkte (0 = endlos)
            <input
              type="number"
              min={0}
              value={settings.maxPoints}
              disabled={settings.gameMode === 'survival'}
              onChange={(e) => update('maxPoints', parseInt(e.target.value, 10) || 0)}
            />
          </label>

          <div className="pp-modes">
            <span>Modus</span>
            <div className="pp-mode-btns">
              <button
                type="button"
                className={settings.gameMode === 'standard' ? 'active' : ''}
                onClick={() => setGameMode('standard')}
              >
                Standard
              </button>
              <button
                type="button"
                className={settings.gameMode === 'survival' ? 'active' : ''}
                onClick={() => setGameMode('survival')}
              >
                Survival
              </button>
            </div>
            <p className="pp-mode-desc">
              {settings.gameMode === 'standard'
                ? 'Erreiche die Punktegrenze zum Gewinnen.'
                : 'Max. 3 Gegentore. Ball wird schneller.'}
            </p>
          </div>

          <label className="pp-sound">
            <input
              type="checkbox"
              checked={settings.soundOn}
              onChange={(e) => update('soundOn', e.target.checked)}
            />
            Sound
          </label>

          <button type="button" className="pp-start-btn" onClick={startGame}>
            START
          </button>

          <p className="pp-hi">
            HI: {highscoreLabel}
          </p>
          <p className="pp-hi-desc">
            {settings.gameMode === 'standard' ? 'Höchste Punktzahl' : 'Längste Zeit'}
          </p>
        </div>
      )}

      {(screen === 'playing' || screen === 'ended') && (
        <>
          <div className="pp-header">
            {settings.gameMode === 'standard' ? (
              <span>DU {userScore} : {aiScore} PC</span>
            ) : (
              <span>LEBEN: {3 - lives}/3 · {survivalTime} · {speedLabel}</span>
            )}
            <div className="pp-controls">
              {screen === 'playing' && (
                <>
                  <span className="material-icons pp-ctrl-icon" title="Pause" onClick={togglePause}>
                    {paused ? 'play_arrow' : 'pause'}
                  </span>
                  <span className="material-icons pp-ctrl-icon" title="Abbrechen" onClick={abortGame}>
                    close
                  </span>
                </>
              )}
              {!isFullscreen ? (
                <span className="material-icons pp-ctrl-icon" title="Fullscreen" onClick={enterFullscreen}>
                  fullscreen
                </span>
              ) : (
                <span className="material-icons pp-ctrl-icon" title="Exit fullscreen" onClick={exitFullscreen}>
                  fullscreen_exit
                </span>
              )}
            </div>
          </div>

          <div className="pp-console">
            <canvas
              ref={canvasRef}
              className="pp-canvas"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onTouchMove={handleTouchMove}
            />

            {screen === 'ended' && (
              <div className="pp-overlay">
                <h2>{endInfo.title}</h2>
                <p>{endInfo.message}</p>
                <button type="button" onClick={backToMenu}>NOCHMAL</button>
              </div>
            )}

            {screen === 'playing' && paused && (
              <div className="pp-overlay">
                <h2>PAUSIERT</h2>
              </div>
            )}
          </div>

          <p className="pp-hint-desktop">
            Am PC: Cursor-Tasten ↑ ↓ – nicht Maus oder Touchpad
          </p>
        </>
      )}
    </div>
  );
}
