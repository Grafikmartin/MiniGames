import { GAME_MODE_LABELS, TOTAL_FLEET_STRENGTH } from './constants';
import { fleetStrength, shotsPerTurnForFleet } from './gameLogic';
import type { GameMode, Ship } from './types';
import './FleetStatus.css';

interface FleetStatusProps {
  gameMode: GameMode;
  playerShips: Ship[];
  phase: string;
  shotsFired: number;
  shotsRemaining: number;
  playerShotsPerTurn: number;
  aiShotsPerTurn: number;
  aiShotsRemaining: number;
  gameOver?: boolean;
}

export function FleetStatus({
  gameMode,
  playerShips,
  phase,
  shotsFired,
  shotsRemaining,
  playerShotsPerTurn,
  aiShotsPerTurn,
  aiShotsRemaining,
  gameOver = false,
}: FleetStatusProps) {
  const playerStrength = fleetStrength(playerShips);
  const playerShotsPerTurnDisplay = shotsPerTurnForFleet(playerStrength, gameMode);
  const remainingShips = playerShips.filter((s) => !s.sunk).length;

  const isPlayerTurn = phase === 'playerSelectingTargets' || phase === 'playerResolvingShots';
  const isAiTurn = phase === 'aiThinking' || phase === 'aiResolvingShots';

  let shotsText = '\u00a0';
  if (gameOver) {
    shotsText = `Deine Flotte: ${remainingShips} Schiff${remainingShips === 1 ? '' : 'e'} · ${playerStrength} / ${TOTAL_FLEET_STRENGTH} Punkte übrig`;
  } else if (isPlayerTurn) {
    const fired = phase === 'playerResolvingShots' ? shotsFired + 1 : shotsFired;
    const remaining = phase === 'playerResolvingShots' ? Math.max(0, shotsRemaining - 1) : shotsRemaining;
    shotsText = `DEINE SCHÜSSE: ${fired} / ${playerShotsPerTurn} · NOCH ${remaining}`;
  } else if (isAiTurn) {
    const aiShotIndex = Math.min(aiShotsPerTurn, aiShotsPerTurn - aiShotsRemaining + 1);
    shotsText = `GEGNER SCHIESST: ${aiShotIndex} / ${aiShotsPerTurn}`;
  }

  return (
    <div className="bs-fleet">
      <div className="bs-fleet-row">
        <span>Spielmodus: {GAME_MODE_LABELS[gameMode]}</span>
      </div>
      {gameMode === 'dynamic' && !gameOver && (
        <>
          <div className="bs-fleet-row">
            <span>Flottenstärke: {playerStrength} / {TOTAL_FLEET_STRENGTH}</span>
          </div>
          <div className="bs-fleet-row">
            <span>Schüsse pro Zug: {playerShotsPerTurnDisplay}</span>
          </div>
        </>
      )}
      {gameOver && (
        <div className="bs-fleet-row">
          <span>Flottenstärke: {playerStrength} / {TOTAL_FLEET_STRENGTH}</span>
        </div>
      )}
      <span className="bs-fleet-shots">{shotsText}</span>
    </div>
  );
}
