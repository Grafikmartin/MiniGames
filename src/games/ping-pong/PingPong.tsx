import { useCallback, useEffect, useRef, useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { usePingPongGame } from './usePingPongGame';
import './PingPong.css';

function SideZone({
  label,
  onMove,
}: {
  label: string;
  onMove: (ratio: number) => void;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);

  const handlePointer = (clientX: number, clientY: number) => {
    const el = zoneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Nach CSS-Drehung ist der Streifen oft breiter als hoch → X-Achse nutzen
    if (rect.width >= rect.height) {
      onMove((clientX - rect.left) / rect.width);
    } else {
      onMove((clientY - rect.top) / rect.height);
    }
  };

  return (
    <div
      ref={zoneRef}
      className="pp-side-zone"
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        e.preventDefault();
        handlePointer(e.clientX, e.clientY);
      }}
    >
      <span className="pp-side-zone-mark" aria-hidden>
        ║
      </span>
    </div>
  );
}

function unlockOrientation() {
  try {
    const orientation = window.screen.orientation as ScreenOrientation & {
      unlock?: () => void;
    };
    orientation.unlock?.();
  } catch {
    /* ignore */
  }
}

async function lockLandscape() {
  try {
    const orientation = window.screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    await orientation.lock?.('landscape');
  } catch {
    /* viele Browser (v. a. iOS) erlauben kein Lock */
  }
}

export function PingPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotated, setRotated] = useState(false);
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
    setPaddleDir,
    setPaddleFromRatio,
    enterFullscreen,
    exitFullscreen,
  } = usePingPongGame(canvasRef);

  const update = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    saveSettings({ ...settings, [key]: value });
  };

  const toggleRotate = useCallback(() => {
    setRotated((prev) => {
      const next = !prev;
      if (next) void lockLandscape();
      else unlockOrientation();
      return next;
    });
  }, []);

  useEffect(() => {
    if (screen === 'menu') {
      setRotated(false);
      unlockOrientation();
    }
  }, [screen]);

  const showSideZones = rotated && screen === 'playing' && !paused;
  const showTouchButtons = !rotated && screen === 'playing' && !paused;

  return (
    <div className={`pp-wrapper${rotated ? ' pp-wrapper--rotated' : ''}`}>
      {screen === 'menu' && (
        <div className="pp-menu">
          <h1>PING PONG</h1>

          <div className="pp-settings-row">
            <div className="pp-field">
              <span>Seite</span>
              <div className="pp-option-btns">
                <button
                  type="button"
                  className={settings.userSide === 'left' ? 'active' : ''}
                  onClick={() => update('userSide', 'left')}
                >
                  Links
                </button>
                <button
                  type="button"
                  className={settings.userSide === 'right' ? 'active' : ''}
                  onClick={() => update('userSide', 'right')}
                >
                  Rechts
                </button>
              </div>
            </div>
            <div className="pp-field">
              <span>Level</span>
              <div className="pp-option-btns pp-option-btns--triple">
                <button
                  type="button"
                  className={settings.difficulty === 'easy' ? 'active' : ''}
                  onClick={() => update('difficulty', 'easy')}
                >
                  Einfach
                </button>
                <button
                  type="button"
                  className={settings.difficulty === 'medium' ? 'active' : ''}
                  onClick={() => update('difficulty', 'medium')}
                >
                  Mittel
                </button>
                <button
                  type="button"
                  className={settings.difficulty === 'hard' ? 'active' : ''}
                  onClick={() => update('difficulty', 'hard')}
                >
                  Schwer
                </button>
              </div>
            </div>
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
            <div className="pp-option-btns">
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

          <p className="pp-hi">HI: {highscoreLabel}</p>
          <p className="pp-hi-desc">
            {settings.gameMode === 'standard' ? 'Höchste Punktzahl' : 'Längste Zeit'}
          </p>
        </div>
      )}

      {(screen === 'playing' || screen === 'ended') && (
        <>
          <div className="pp-header">
            {settings.gameMode === 'standard' ? (
              <span>
                DU {userScore} : {aiScore} PC
              </span>
            ) : (
              <span>
                LEBEN: {3 - lives}/3 · {survivalTime} · {speedLabel}
              </span>
            )}
            <div className="pp-controls">
              {screen === 'playing' && (
                <>
                  <span
                    className="material-icons pp-ctrl-icon"
                    title={rotated ? 'Hochkant' : 'Querformat drehen'}
                    onClick={toggleRotate}
                  >
                    screen_rotation
                  </span>
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

          <div className="pp-play-stage">
            {showSideZones && (
              <SideZone label="Kelle steuern links" onMove={setPaddleFromRatio} />
            )}

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
                  <button type="button" onClick={backToMenu}>
                    NOCHMAL
                  </button>
                </div>
              )}

              {screen === 'playing' && paused && (
                <div className="pp-overlay">
                  <h2>PAUSIERT</h2>
                </div>
              )}
            </div>

            {showSideZones && (
              <SideZone label="Kelle steuern rechts" onMove={setPaddleFromRatio} />
            )}
          </div>

          {showTouchButtons && (
            <div className="pp-touch-controls" aria-label="Kelle steuern">
              <button
                type="button"
                className="pp-touch-btn"
                aria-label="Kelle hoch"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setPaddleDir('up');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setPaddleDir(null);
                }}
                onPointerCancel={() => setPaddleDir(null)}
                onLostPointerCapture={() => setPaddleDir(null)}
              >
                ▲ HOCH
              </button>
              <button
                type="button"
                className="pp-touch-btn"
                aria-label="Kelle runter"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setPaddleDir('down');
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setPaddleDir(null);
                }}
                onPointerCancel={() => setPaddleDir(null)}
                onLostPointerCapture={() => setPaddleDir(null)}
              >
                ▼ RUNTER
              </button>
            </div>
          )}

          <p className="pp-hint-desktop">
            Am PC: Cursor-Tasten ↑ ↓ – nicht Maus oder Touchpad
          </p>
          <p className={`pp-hint-touch${rotated ? ' pp-hint-touch--rotated' : ''}`}>
            {rotated
              ? 'Finger links oder rechts neben dem Feld bewegen'
              : 'HOCH/RUNTER halten · oder Drehen-Button für Querformat'}
          </p>
        </>
      )}
    </div>
  );
}
