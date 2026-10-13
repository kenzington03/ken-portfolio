// One sound on the whole intro: a real DSLR shutter (CC0, see
// public/assets/sfx/CREDITS.txt). No score, no "enter with sound" gate.
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

export function disposeSfx() {
  ctx?.close?.();
  ctx = null;
  buffer = null;
}
