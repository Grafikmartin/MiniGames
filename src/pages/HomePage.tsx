import { GameCard } from '../components/GameCard';
import { games } from '../data/games';
import './HomePage.css';

export function HomePage() {
  return (
    <div className="home">
      <header className="home-header">
        <h1 className="home-title">
          <span>MINI</span>
          <span>SPIELE</span>
        </h1>
        <p className="home-subtitle">Retro-Games zum Spielen</p>
      </header>

      <div className="home-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
