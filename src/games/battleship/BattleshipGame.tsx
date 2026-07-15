import { SHOTS_PER_TURN } from './constants';
import { BattleshipBoard } from './BattleshipBoard';
import { FleetStatus } from './FleetStatus';
import { GameMessageBar } from './GameMessage';
import { useBattleshipGame } from './useBattleshipGame';
import './BattleshipGame.css';

export function BattleshipGame() {
  const {
    state,
    dispatch,
    onCellPointer,
    currentShipLabel,
    isPlacement,
    isBattle,
    gameOver,
  } = useBattleshipGame();

  const enemyDisabled =
    state.phase !== 'playerSelectingTargets' && state.phase !== 'playerResolvingShots';

  const shotsFiredThisTurn = SHOTS_PER_TURN - state.shotsRemaining;

  const ownBoardActive =
    isPlacement || state.phase === 'aiThinking' || state.phase === 'aiResolvingShots';
  const enemyBoardActive =
    state.phase === 'playerSelectingTargets' || state.phase === 'playerResolvingShots';

  return (
    <div className="bs-wrapper">
      <GameMessageBar message={state.message} phase={state.phase} />

      {isPlacement && currentShipLabel && (
        <p className="bs-ship-info">Aktuell: {currentShipLabel}</p>
      )}

      {isBattle && (
        <FleetStatus
          enemyShips={state.enemyShips}
          playerShips={state.playerShips}
          phase={state.phase}
          shotsFired={shotsFiredThisTurn}
          shotsRemaining={state.shotsRemaining}
          aiShotsRemaining={state.aiShotsRemaining}
        />
      )}

      {isBattle && (
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
            RADAR
          </button>
        </div>
      )}

      <div className={`bs-boards${isBattle ? ' bs-boards--battle' : ''}`}>
        {(isPlacement || isBattle) && (
          <div
            className={`bs-board-panel${isBattle && state.activeBoard !== 'own' ? ' bs-board-panel--hidden-mobile' : ''}`}
          >
            <BattleshipBoard
              label="EIGENE FLOTTE"
              mode={isPlacement ? 'placement' : 'own'}
              board={state.playerBoard}
              ships={state.playerShips}
              preview={state.preview}
              cursor={state.cursor}
              animatingCells={state.animatingCells}
              disabled={false}
              active={ownBoardActive}
              onCellPointer={(c) => onCellPointer(c, 'own')}
            />
          </div>
        )}

        {isBattle && (
          <div
            className={`bs-board-panel${state.activeBoard !== 'enemy' ? ' bs-board-panel--hidden-mobile' : ''}`}
          >
            <BattleshipBoard
              label="GEGNERISCHES GEBIET"
              mode="radar"
              board={state.enemyBoard}
              ships={state.enemyShips}
              radar={state.radar}
              cursor={state.cursor}
              selectedTargets={[]}
              animatingCells={state.animatingCells}
              disabled={enemyDisabled}
              active={enemyBoardActive}
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

      {isPlacement && (
        <p className="bs-hint">
          Pfeiltasten/WASD bewegen · R drehen · Enter setzen · Escape zurück
        </p>
      )}
    </div>
  );
}
