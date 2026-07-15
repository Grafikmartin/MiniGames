/** Gemeinsame Retro-Sounds per Web Audio – ohne MP3-Assets. */

let ctx: AudioContext | null = null;
let enabled = true;

export function getAudioContext(): AudioContext | null {
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

export function setRetroSoundEnabled(on: boolean) {
  enabled = on;
}

export function isRetroSoundEnabled() {
  return enabled;
}

export function unlockAudio() {
  getAudioContext();
}

export function beep(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.08,
) {
  const audio = getAudioContext();
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

export function sweep(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.08,
) {
  const audio = getAudioContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  const t = audio.currentTime;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + duration);
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function beepSequence(
  notes: Array<{ freq: number; duration: number; delay?: number; type?: OscillatorType; gain?: number }>,
) {
  let delay = 0;
  for (const note of notes) {
    const wait = note.delay ?? 0;
    delay += wait;
    const d = delay;
    setTimeout(() => {
      beep(note.freq, note.duration, note.type ?? 'square', note.gain ?? 0.08);
    }, d * 1000);
    delay += note.duration;
  }
}
