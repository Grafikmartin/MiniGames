import { BattleshipBoard } from './BattleshipBoard';
import { FleetStatus } from './FleetStatus';
import { GameHelp } from './GameHelp';
import { GameMessageBar } from './GameMessage';
import { useBattleshipGame } from './useBattleshipGame';
import './BattleshipGame.css';
import './GameHelp.css';

export function BattleshipGame() {
  const {
    state,
    dispatch,
    onCellPointer,
    currentShipLabel,
    isModeSelect,
    isPlacement,
    isBattle,
    showBattlefield,
    gameOver,
  } = useBattleshipGame();

  const enemyDisabled =
    state.phase !== 'playerSelectingTargets' && state.phase !== 'playerResolvingShots';

  const shotsFiredThisTurn = state.playerShotsPerTurn - state.shotsRemaining;

  const ownBoardActive =
    !gameOver &&
    (isPlacement || state.phase === 'aiThinking' || state.phase === 'aiResolvingShots');
  const enemyBoardActive =
    !gameOver &&
    (state.phase === 'playerSelectingTargets' || state.phase === 'playerResolvingShots');

  return (
    <div className="bs-wrapper">
      <GameMessageBar message={state.message} phase={state.phase} />

      {isModeSelect && (
        <div className="bs-mode-select">
          <p className="bs-mode-title">Spielmodus wählen</p>
          <div className="bs-mode-buttons">
            <button
              type="button"
              className="bs-btn bs-btn--mode"
              onClick={() => dispatch({ type: 'SELECT_GAME_MODE', mode: 'classic' })}
            >
              KLASSISCH
            </button>
            <button
              type="button"
              className="bs-btn bs-btn--mode"
              onClick={() => dispatch({ type: 'SELECT_GAME_MODE', mode: 'dynamic' })}
            >
              DYNAMISCH
            </button>
          </div>
          <GameHelp />
        </div>
      )}

      {isPlacement && currentShipLabel && (
        <p className="bs-ship-info">Aktuell: {currentShipLabel}</p>
      )}

      {showBattlefield && (
        <FleetStatus
          gameMode={state.gameMode}
          playerShips={state.playerShips}
          phase={state.phase}
          shotsFired={shotsFiredThisTurn}
          shotsRemaining={state.shotsRemaining}
          playerShotsPerTurn={state.playerShotsPerTurn}
          aiShotsPerTurn={state.aiShotsPerTurn}
          aiShotsRemaining={state.aiShotsRemaining}
          gameOver={gameOver}
        />
      )}

      {showBattlefield && (
        <div className="bs-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`bs-tab${state.activeBoard === 'own' ? ' bs-tab--active' : ''}`}
            aria-selected={state.activeBoard === 'own'}
            onClick={() => dispatch({ type: 'SET_ACTIVE_BOARD', board: 'own' })}
          >
            EIGENE FLOTTE
          </button>
          <button
            type="button"
            role="tab"
            className={`bs-tab${state.activeBoard === 'enemy' ? ' bs-tab--active' : ''}`}
            aria-selected={state.activeBoard === 'enemy'}
            onClick={() => dispatch({ type: 'SET_ACTIVE_BOARD', board: 'enemy' })}
          >
            {gameOver ? 'GEGNER-FLOTTE' : 'RADAR'}
          </button>
        </div>
      )}

      <div className={`bs-boards${showBattlefield ? ' bs-boards--battle' : ''}`}>
        {(isPlacement || showBattlefield) && (
          <div
            className={`bs-board-panel${showBattlefield && state.activeBoard !== 'own' ? ' bs-board-panel--hidden-mobile' : ''}`}
          >
            <BattleshipBoard
              label="EIGENE FLOTTE"
              mode={isPlacement ? 'placement' : 'own'}
              board={state.playerBoard}
              ships={state.playerShips}
              preview={state.preview}
              cursor={state.cursor}
              animatingCells={state.animatingCells}
              disabled={gameOver}
              active={ownBoardActive}
              onCellPointer={(c) => onCellPointer(c, 'own')}
            />
          </div>
        )}

        {showBattlefield && (
          <div
            className={`bs-board-panel${state.activeBoard !== 'enemy' ? ' bs-board-panel--hidden-mobile' : ''}`}
          >
            <BattleshipBoard
              label={gameOver ? 'GEGNER-FLOTTE (AUFGELOGEN)' : 'GEGNERISCHES GEBIET'}
              mode="radar"
              board={state.enemyBoard}
              ships={state.enemyShips}
              radar={state.radar}
              cursor={state.cursor}
              selectedTargets={[]}
              animatingCells={state.animatingCells}
              disabled={enemyDisabled || gameOver}
              active={enemyBoardActive}
              revealAllShips={gameOver}
              onCellPointer={(c) => onCellPointer(c, 'enemy')}
            />
          </div>
        )}
      </div>

      <div className="bs-controls">
        {isPlacement && (
          <>
            <button type="button" className="bs-btn" onClick={() => dispatch({ type: 'ROTATE_PREVIEW' })}>
              DREHEN
            </button>
            <button
              type="button"
              className="bs-btn"
              disabled={!state.preview?.valid}
              onClick={() => dispatch({ type: 'CONFIRM_PLACEMENT' })}
            >
              SETZEN
            </button>
            <button type="button" className="bs-btn" onClick={() => dispatch({ type: 'RANDOM_PLACE' })}>
              ZUFÄLLIG
            </button>
            <button type="button" className="bs-btn bs-btn--ghost" onClick={() => dispatch({ type: 'RESET' })}>
              ZURÜCKSETZEN
            </button>
          </>
        )}

        {gameOver && (
          <button type="button" className="bs-btn" onClick={() => dispatch({ type: 'RESET' })}>
            NEUES SPIEL
          </button>
        )}

        <button type="button" className="bs-btn bs-btn--ghost" onClick={() => dispatch({ type: 'TOGGLE_SOUND' })}>
          {state.soundEnabled ? 'TON AUS' : 'TON AN'}
        </button>
      </div>

      {isBattle && (
        <p className="bs-hint bs-hint--battle">
          {state.phase === 'playerSelectingTargets' || state.phase === 'playerResolvingShots'
            ? `Feld antippen oder Enter – ein Schuss nacheinander (${Math.max(0, state.phase === 'playerResolvingShots' ? state.shotsRemaining - 1 : state.shotsRemaining)} übrig)`
            : '\u00a0'}
        </p>
      )}

      {gameOver && (
        <p className="bs-hint bs-hint--battle">
          Zwischen eigener Flotte und Gegner wechseln · Gegner-Schiffe sind aufgedeckt · „Neues Spiel“ wenn du bereit bist
        </p>
      )}

      {isPlacement && (
        <p className="bs-hint">
          Pfeiltasten/WASD bewegen · R drehen · Enter setzen · Escape zurück
        </p>
      )}
    </div>
  );
}
