import type { GameMessage } from './types';
import './GameMessage.css';

interface GameMessageProps {
  message: GameMessage;
  phase: string;
}

export function GameMessageBar({ message, phase }: GameMessageProps) {
  return (
    <p className="bs-message" aria-live="polite">
      <span className="bs-message-phase">{phaseLabel(phase)}</span>
      {message.text}
    </p>
  );
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'modeSelect': return '';
    case 'placement': return 'PLATZIERUNG · ';
    case 'playerSelectingTargets':
    case 'playerResolvingShots': return 'DEIN ZUG · ';
    case 'aiThinking':
    case 'aiResolvingShots': return 'GEGNER · ';
    case 'victory': return 'SIEG · ';
    case 'defeat': return 'VERLOREN · ';
    default: return '';
  }
}
