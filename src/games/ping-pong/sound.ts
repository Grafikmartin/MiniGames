import { beep, sweep } from '../../lib/retroSound';

export { unlockAudio } from '../../lib/retroSound';

/** Paddle-Treffer – Tonhöhe leicht abhängig von Ballposition (0–1). */
export function playPaddleHit(ballYNorm = 0.5) {
  const freq = 520 + ballYNorm * 280;
  sweep(freq * 1.15, freq, 0.045, 'square', 0.09);
  setTimeout(() => beep(freq * 0.85, 0.03, 'sine', 0.04), 20);
}
