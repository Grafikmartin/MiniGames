import type { GameMode } from './constants';
import type { GamePhase } from './types';

interface BreakoutHudProps {
  score: number;
  highscore: number;
  lives: number;
  levelIndex: number;
  levelName: string;
  mode: GameMode;
  phase: GamePhase;
  statusMessage: string;
  onPause: () => void;
}

export function BreakoutHud({
  score,
  highscore,
  lives,
  levelIndex,
  levelName,
  mode,
  phase,
  statusMessage,
  onPause,
}: BreakoutHudProps) {
  const modeLabel = mode === 'classic' ? 'Klassisch' : 'Endlos';
  const livesDisplay = '●'.repeat(Math.max(0, lives)) || '0';

  return (
    <div className="bo-hud" aria-live="polite">
      <div className="bo-hud-row">
        <span>PUNKTE: {score}</span>
        <span>HI: {highscore}</span>
      </div>
      <div className="bo-hud-row">
        <span>LEVEL: {levelIndex + 1}</span>
        <span>LEBEN: {livesDisplay}</span>
      </div>
      <div className="bo-hud-row bo-hud-row--meta">
        <span>{levelName}</span>
        <span>{modeLabel}</span>
        {(phase === 'playing' || phase === 'paused') && (
          <button type="button" className="bo-btn bo-btn--small" onClick={onPause} aria-label="Pause">
            {phase === 'paused' ? 'WEITER' : 'PAUSE'}
          </button>
        )}
      </div>
      {statusMessage && phase !== 'playing' && (
        <p className="bo-hud-status">{statusMessage}</p>
      )}
    </div>
  );
}
