import { PixelSprite } from '../../components/PixelSprite';
import './BreakoutCardIcon.css';

const PADDLE = ['1111111111', '1111111111'];
const BALL = ['0110', '1111', '1111', '0110'];
const BRICK = ['11111111', '11111111', '11111111'];

export function BreakoutCardIcon() {
  return (
    <div className="breakout-card-icon" aria-hidden>
      <div className="breakout-card-icon__bricks">
        <PixelSprite sprite={[...BRICK]} pixelSize={2} />
        <PixelSprite sprite={[...BRICK]} pixelSize={2} />
        <PixelSprite sprite={[...BRICK]} pixelSize={2} />
      </div>
      <div className="breakout-card-icon__ball">
        <PixelSprite sprite={[...BALL]} pixelSize={2} />
      </div>
      <div className="breakout-card-icon__paddle">
        <PixelSprite sprite={[...PADDLE]} pixelSize={2} />
      </div>
    </div>
  );
}
