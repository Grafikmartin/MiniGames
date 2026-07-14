import { useLocation } from 'react-router-dom';
import { games } from '../data/games';
import './ComingSoonPage.css';

export function ComingSoonPage() {
  const { pathname } = useLocation();
  const game = games.find((g) => g.path === pathname);

  return (
    <div className="coming-soon">
      <span className="coming-soon-icon">{game?.icon ?? '🎮'}</span>
      <h1>{game?.title ?? 'Spiel'}</h1>
      <p>Kommt bald – dieses Minispiel wird noch eingebaut.</p>
    </div>
  );
}
