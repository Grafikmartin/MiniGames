import { Link } from 'react-router-dom';
import type { GameInfo } from '../data/games';
import './GameCard.css';

interface GameCardProps {
  game: GameInfo;
}

export function GameCard({ game }: GameCardProps) {
  const isAvailable = game.status === 'available';

  const content = (
    <>
      <span className="game-card-icon">{game.icon}</span>
      <h2 className="game-card-title">{game.title}</h2>
      <p className="game-card-desc">{game.description}</p>
      {!isAvailable && <span className="game-card-badge">Demnächst</span>}
    </>
  );

  if (isAvailable) {
    return (
      <Link to={game.path} className="game-card game-card--available">
        {content}
      </Link>
    );
  }

  return (
    <Link to={game.path} className="game-card game-card--soon">
      {content}
    </Link>
  );
}
