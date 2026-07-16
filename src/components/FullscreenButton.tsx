import { useFullscreen } from '../hooks/useFullscreen';
import './FullscreenButton.css';

interface FullscreenButtonProps {
  className?: string;
}

export function FullscreenButton({ className = '' }: FullscreenButtonProps) {
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();

  return (
    <span
      className={`fs-btn material-icons ${className}`.trim()}
      role="button"
      tabIndex={0}
      title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
      aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
      onClick={isFullscreen ? exitFullscreen : enterFullscreen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isFullscreen) exitFullscreen();
          else enterFullscreen();
        }
      }}
    >
      {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
    </span>
  );
}
