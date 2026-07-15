import { beep, beepSequence, sweep } from '../../lib/retroSound';

export { unlockAudio, setRetroSoundEnabled } from '../../lib/retroSound';

export function playMenuTick() {
  beep(660, 0.04, 'square', 0.06);
}

export function playPaddleHit() {
  sweep(280, 420, 0.05, 'square', 0.09);
}

export function playWallHit() {
  beep(180, 0.03, 'square', 0.05);
}

export function playBrickHit() {
  beep(520, 0.04, 'square', 0.07);
}

export function playBrickDestroy() {
  sweep(640, 320, 0.08, 'square', 0.08);
}

export function playStrongDamage() {
  beep(380, 0.06, 'triangle', 0.07);
}

export function playLifeLost() {
  beepSequence([
    { freq: 220, duration: 0.1 },
    { freq: 160, duration: 0.15, delay: 0.05 },
  ]);
}

export function playLevelComplete() {
  beepSequence([
    { freq: 440, duration: 0.08 },
    { freq: 554, duration: 0.08, delay: 0.06 },
    { freq: 660, duration: 0.12, delay: 0.06 },
  ]);
}

export function playGameOver() {
  beepSequence([
    { freq: 330, duration: 0.12 },
    { freq: 220, duration: 0.12, delay: 0.08 },
    { freq: 165, duration: 0.2, delay: 0.08 },
  ]);
}

export function playHighscore() {
  beepSequence([
    { freq: 660, duration: 0.06 },
    { freq: 880, duration: 0.1, delay: 0.05 },
  ]);
}

export function playLaunch() {
  beep(300, 0.05, 'square', 0.06);
}
