import { Link } from 'react-router-dom';
import { gameSprites } from '../data/gameSprites';
import type { GameInfo } from '../data/games';
import { PixelSprite } from './PixelSprite';
import './GameCard.css';

interface GameCardProps {
  game: GameInfo;
}

export function GameCard({ game }: GameCardProps) {
  const isAvailable = game.status === 'available';
  const sprite = gameSprites[game.id];

  const content = (
    <>
      {sprite && (
        <div className="game-card-icon">
          <PixelSprite sprite={sprite} pixelSize={6} />
        </div>
      )}
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
