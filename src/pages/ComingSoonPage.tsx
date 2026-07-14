import { useLocation } from 'react-router-dom';
import { gameSprites } from '../data/gameSprites';
import { games } from '../data/games';
import { PixelSprite } from '../components/PixelSprite';
import './ComingSoonPage.css';

export function ComingSoonPage() {
  const { pathname } = useLocation();
  const game = games.find((g) => g.path === pathname);
  const sprite = game ? gameSprites[game.id] : undefined;

  return (
    <div className="coming-soon">
      {sprite ? (
        <div className="coming-soon-icon">
          <PixelSprite sprite={sprite} pixelSize={7} />
        </div>
      ) : (
        <div className="coming-soon-icon">
          <PixelSprite sprite={['00100', '01110', '11111', '01110', '00100']} pixelSize={7} />
        </div>
      )}
      <h1>{game?.title ?? 'Spiel'}</h1>
      <p>Kommt bald – dieses Minispiel wird noch eingebaut.</p>
    </div>
  );
}
