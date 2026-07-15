/** Leichtgewichtige Retro-Sounds per Web Audio – ohne MP3-Assets. */

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function beep(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.08) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(audio.destination);
  const t = audio.currentTime;
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

export function unlockAudio() {
  getCtx();
}

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
    [520, 420, 320, 220].forEach((f, i) => setTimeout(() => beep(f, 0.07, 'square', 0.07), i * 70));
  },
  victory: () => {
    [440, 554, 659, 880].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'square', 0.08), i * 100));
  },
  defeat: () => {
    [330, 260, 196, 130].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'square', 0.07), i * 120));
  },
};
