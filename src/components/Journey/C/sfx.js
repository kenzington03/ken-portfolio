// Two sounds on the intro: a real DSLR shutter (CC0, see
// public/assets/sfx/CREDITS.txt), and the swish of the net (made here, from
// noise). No score, no "enter with sound" gate.
// Browsers only let audio start from a user gesture, so the opening curtain
// is silent on a cold visit; every click that takes a photo is not.

const URL = '/assets/sfx/shutter.wav';

let ctx = null;
let bytes = null;
let buffer = null;

export function preloadShutter() {
  if (bytes || typeof fetch === 'undefined') return;
  bytes = fetch(URL)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
}

export async function playShutter({ level = 0.8, rate = 1 } = {}) {
  try {
    preloadShutter();
    // Without a gesture, resume() can stay pending and fire the click
    // seconds later at a random moment. Skip instead.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') await ctx.resume();
    if (ctx.state !== 'running') return; // no gesture yet: stay quiet
    if (!buffer) {
      const ab = await bytes;
      if (!ab) return;
      buffer = await ctx.decodeAudioData(ab.slice(0));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = level;
    src.connect(g).connect(ctx.destination);
    src.start();
  } catch {
    /* sound is a garnish; never let it break the page */
  }
}

/** Nothing but net: a soft burst of noise swept down through a band, the
 *  sound of a ball dropping clean through the strings. */
export async function playSwish({ level = 0.5 } = {}) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') await ctx.resume();
    if (ctx.state !== 'running') return;
    const dur = 0.42;
    const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.1;
    const t = ctx.currentTime;
    band.frequency.setValueAtTime(5200, t);
    band.frequency.exponentialRampToValueAtTime(1300, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.05);
    g.gain.exponentialRampToValueAtTime(level * 0.35, t + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(band).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  } catch {
    /* sound is a garnish; never let it break the page */
  }
}

export function disposeSfx() {
  ctx?.close?.();
  ctx = null;
  buffer = null;
}
