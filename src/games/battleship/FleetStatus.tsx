import { SHOTS_PER_TURN } from './constants';
import { countRemainingShips } from './gameLogic';
import type { Ship } from './types';
import './FleetStatus.css';

interface FleetStatusProps {
  enemyShips: Ship[];
  playerShips: Ship[];
  phase: string;
  shotsFired: number;
  shotsRemaining: number;
  aiShotsRemaining: number;
}

export function FleetStatus({
  enemyShips,
  playerShips,
  phase,
  shotsFired,
  shotsRemaining,
  aiShotsRemaining,
}: FleetStatusProps) {
  const enemyLeft = countRemainingShips(enemyShips);
  const playerLeft = countRemainingShips(playerShips);

  const isPlayerTurn = phase === 'playerSelectingTargets' || phase === 'playerResolvingShots';
  const isAiTurn = phase === 'aiThinking' || phase === 'aiResolvingShots';

  let shotsText = '\u00a0';
  if (isPlayerTurn) {
    const fired = phase === 'playerResolvingShots' ? shotsFired + 1 : shotsFired;
    const remaining = phase === 'playerResolvingShots' ? Math.max(0, shotsRemaining - 1) : shotsRemaining;
    shotsText = `DEINE SCHÜSSE: ${fired} / ${SHOTS_PER_TURN} · NOCH ${remaining}`;
  } else if (isAiTurn) {
    shotsText = `GEGNER SCHIESST: ${Math.min(SHOTS_PER_TURN, SHOTS_PER_TURN - aiShotsRemaining + 1)} / ${SHOTS_PER_TURN}`;
  }

  return (
    <div className="bs-fleet">
      <div className="bs-fleet-row">
        <span>Gegner: {enemyLeft} Schiffe</span>
        <span>Eigene: {playerLeft} Schiffe</span>
      </div>
      <span className="bs-fleet-shots">{shotsText}</span>
    </div>
  );
}
