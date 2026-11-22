// audio.js — all sound is synthesised with WebAudio oscillators. No files.
// A low tense drone while playing, a blip on loot, a rising alarm sting
// when spotted, and a little fanfare on the getaway.

let ctx = null;
let muted = false;
let droneNodes = null;

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  if (droneNodes) { try { droneNodes.gain.gain.value = muted ? 0 : 0.05; } catch (e) {} }
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when, slideTo) {
  const c = ensureCtx(); if (!c || muted) return;
  const t0 = c.currentTime + (when || 0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export function startDrone() {
  const c = ensureCtx(); if (!c || droneNodes) return;
  const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
  o1.type = 'triangle'; o1.frequency.value = 55;
  o2.type = 'sine'; o2.frequency.value = 55.7;
  g.gain.value = muted ? 0 : 0.045;
  o1.connect(g); o2.connect(g); g.connect(c.destination);
  o1.start(); o2.start();
  droneNodes = { o1, o2, gain: g };
}

export function playLoot() { tone(880, 0.12, 'sine', 0.14); tone(1318, 0.18, 'sine', 0.12, 0.07); }
export function playVault() { tone(523, 0.15, 'triangle', 0.15); tone(659, 0.15, 'triangle', 0.15, 0.12); tone(784, 0.3, 'triangle', 0.15, 0.24); }
export function playAlarm() { tone(440, 0.25, 'sawtooth', 0.08, 0, 660); }
export function playCaught() { tone(220, 0.5, 'sawtooth', 0.16, 0, 110); tone(110, 0.7, 'square', 0.1, 0.15, 55); }
export function playEscape() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.15, i * 0.11)); }
export function playClick() { tone(660, 0.06, 'square', 0.06); }
export function playCoinToss() { tone(1200, 0.1, 'sine', 0.1, 0, 500); }
