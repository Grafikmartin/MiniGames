import { beep, beepSequence, sweep } from '../../lib/retroSound';

export { unlockAudio, setRetroSoundEnabled as setSoundEnabled } from '../../lib/retroSound';

export const snakeSound = {
  eat: () => {
    sweep(320, 720, 0.06, 'square', 0.07);
    setTimeout(() => beep(880, 0.025, 'square', 0.05), 40);
  },
  gameOver: () => {
    beepSequence([
      { freq: 392, duration: 0.12, gain: 0.08 },
      { freq: 330, duration: 0.12, delay: 0.08, gain: 0.08 },
      { freq: 262, duration: 0.12, delay: 0.08, gain: 0.08 },
      { freq: 196, duration: 0.2, delay: 0.08, gain: 0.07 },
    ]);
  },
};
