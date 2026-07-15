import type { GameMode, GameSettings } from './constants';

interface BreakoutMenuProps {
  settings: GameSettings;
  highscore: number;
  onStart: () => void;
  onHelp: () => void;
  onModeChange: (mode: GameMode) => void;
  onSoundToggle: () => void;
}

export function BreakoutMenu({
  settings,
  highscore,
  onStart,
  onHelp,
  onModeChange,
  onSoundToggle,
}: BreakoutMenuProps) {
  return (
    <div className="bo-menu">
      <h1 className="bo-menu-title">BREAKOUT</h1>

      <div className="bo-field">
        <span>Modus</span>
        <div className="bo-option-btns">
          <button
            type="button"
            className={settings.mode === 'classic' ? 'active' : ''}
            onClick={() => onModeChange('classic')}
          >
            Klassisch
          </button>
          <button
            type="button"
            className={settings.mode === 'endless' ? 'active' : ''}
            onClick={() => onModeChange('endless')}
          >
            Endlos
          </button>
        </div>
        <p className="bo-mode-desc">
          {settings.mode === 'classic'
            ? '3 Leben · 5 Level · Level-Bonus'
            : 'Endlose Wellen · steigende Geschwindigkeit'}
        </p>
      </div>

      <label className="bo-sound">
        <input type="checkbox" checked={settings.soundOn} onChange={onSoundToggle} />
        Sound
      </label>

      <p className="bo-hi">HI ({settings.mode === 'classic' ? 'Klassisch' : 'Endlos'}): {highscore}</p>

      <button type="button" className="bo-btn bo-btn--primary" onClick={onStart}>
        START
      </button>
      <button type="button" className="bo-btn" onClick={onHelp}>
        ANLEITUNG
      </button>
    </div>
  );
}
