'use client';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delay = 0
) {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

export function playMessageSent() {
  playTone(880, 0.08, 'sine', 0.1);
}

export function playMessageReceived() {
  playTone(523, 0.06, 'sine', 0.08);
  playTone(659, 0.08, 'sine', 0.08, 0.07);
}

export function playScenarioStart() {
  playTone(392, 0.15, 'sine', 0.12);
  playTone(523, 0.15, 'sine', 0.12, 0.15);
  playTone(659, 0.25, 'sine', 0.12, 0.3);
}

export function playLevelUp() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    playTone(freq, 0.18, 'sine', 0.15, i * 0.12);
  });
}

export function playAchievement() {
  [784, 988, 1175].forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.13, i * 0.1);
  });
}

export function playEndSession() {
  playTone(659, 0.12, 'sine', 0.1);
  playTone(523, 0.2, 'sine', 0.1, 0.13);
}
