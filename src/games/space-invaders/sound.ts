import { beep, getAudioContext, sweep } from '../../lib/retroSound';

export { unlockAudio, setRetroSoundEnabled as setSfxEnabled } from '../../lib/retroSound';

const MELODY = [110, 110, 131, 110, 165, 131, 110, 98];

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicActive = false;
let musicStep = 0;

export const siSound = {
  playerLaser: () => sweep(880, 1320, 0.05, 'square', 0.06),
  alienLaser: () => sweep(420, 180, 0.07, 'sawtooth', 0.05),
};

export function startSiMusic() {
  if (musicTimer) return;
  musicActive = true;
  musicTimer = setInterval(() => {
    if (!musicActive || !getAudioContext()) return;
    beep(MELODY[musicStep % MELODY.length], 0.14, 'square', 0.028);
    musicStep++;
  }, 190);
}

export function stopSiMusic() {
  musicActive = false;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function setSiMusicPlaying(on: boolean) {
  if (on) startSiMusic();
  else stopSiMusic();
}

export function isSiMusicPlaying() {
  return musicActive;
}
