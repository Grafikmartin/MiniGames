import { beep, beepSequence } from '../../lib/retroSound';

export {
  unlockAudio,
  setRetroSoundEnabled as setSoundEnabled,
  isRetroSoundEnabled as isSoundEnabled,
} from '../../lib/retroSound';

export const bsSound = {
  tick: () => beep(880, 0.025, 'square', 0.04),
  rotate: () => beep(440, 0.04, 'square', 0.06),
  place: () => {
    beep(180, 0.06, 'square', 0.1);
    setTimeout(() => beep(120, 0.08, 'square', 0.08), 30);
  },
  fire: () => beep(220, 0.05, 'sawtooth', 0.07),
  water: () => beep(300, 0.08, 'sine', 0.05),
  hit: () => {
    beep(660, 0.05, 'square', 0.1);
    setTimeout(() => beep(880, 0.06, 'square', 0.08), 50);
  },
  sunk: () => {
    beepSequence([
      { freq: 520, duration: 0.07, gain: 0.07 },
      { freq: 420, duration: 0.07, delay: 0.07, gain: 0.07 },
      { freq: 320, duration: 0.07, delay: 0.07, gain: 0.07 },
      { freq: 220, duration: 0.07, delay: 0.07, gain: 0.07 },
    ]);
  },
  victory: () => {
    beepSequence([
      { freq: 440, duration: 0.12, gain: 0.08 },
      { freq: 554, duration: 0.12, delay: 0.1, gain: 0.08 },
      { freq: 659, duration: 0.12, delay: 0.1, gain: 0.08 },
      { freq: 880, duration: 0.12, delay: 0.1, gain: 0.08 },
    ]);
  },
  defeat: () => {
    beepSequence([
      { freq: 330, duration: 0.14, gain: 0.07 },
      { freq: 260, duration: 0.14, delay: 0.12, gain: 0.07 },
      { freq: 196, duration: 0.14, delay: 0.12, gain: 0.07 },
      { freq: 130, duration: 0.14, delay: 0.12, gain: 0.07 },
    ]);
  },
};
