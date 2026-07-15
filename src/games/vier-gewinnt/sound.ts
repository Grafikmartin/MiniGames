import { beep, beepSequence, sweep } from '../../lib/retroSound';

export { unlockAudio } from '../../lib/retroSound';

export const vgSound = {
  /** Spieler (○) – weicher Fallton */
  playerDrop: () => {
    sweep(420, 220, 0.07, 'sine', 0.08);
    setTimeout(() => beep(330, 0.04, 'square', 0.05), 35);
  },
  /** Computer (⨯) – etwas schärfer */
  computerDrop: () => {
    sweep(280, 180, 0.06, 'sawtooth', 0.06);
    setTimeout(() => beep(220, 0.035, 'square', 0.05), 30);
  },
  win: () => {
    beepSequence([
      { freq: 523, duration: 0.1, gain: 0.08 },
      { freq: 659, duration: 0.1, delay: 0.08, gain: 0.08 },
      { freq: 784, duration: 0.1, delay: 0.08, gain: 0.08 },
      { freq: 1047, duration: 0.18, delay: 0.08, gain: 0.09 },
    ]);
  },
};
