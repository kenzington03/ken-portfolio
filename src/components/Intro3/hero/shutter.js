// The real shutter: a CC0 DSLR recording (public/assets/sfx/CREDITS.txt),
// played through the ambient score's own graph so mute and the M key apply.
// Falls back to the synthesised click if the file can't be fetched/decoded.

const URL = '/assets/sfx/shutter.wav';

let bytes = null; // ArrayBuffer, fetched early (no AudioContext needed)
let buffer = null; // AudioBuffer, decoded once the context exists
let decoding = null;

export function preloadShutter() {
  if (bytes || typeof fetch === 'undefined') return;
  bytes = fetch(URL)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);
}

function decode(ctx) {
  if (buffer) return Promise.resolve(buffer);
  if (!decoding) {
    preloadShutter();
    decoding = bytes
      .then((ab) => (ab ? ctx.decodeAudioData(ab.slice(0)) : null))
      .then((b) => {
        buffer = b;
        return b;
      })
      .catch(() => null);
  }
  return decoding;
}

/** Warm the decode as soon as sound is switched on, so the click is instant. */
export function primeShutter(ambient) {
  if (ambient?.ctx) decode(ambient.ctx);
}

export function playShutter(ambient, { level = 0.9, rate = 1 } = {}) {
  if (!ambient?.ctx || !ambient.on) return;
  const ctx = ambient.ctx;
  if (!buffer) {
    // First click before decode finished: synth now, real file next time.
    decode(ctx);
    ambient.shutter();
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.value = level;
  src.connect(g).connect(ambient.master);
  if (ambient.reverbSend) {
    const send = ctx.createGain();
    send.gain.value = 0.25;
    g.connect(send).connect(ambient.reverbSend);
  }
  src.start();
}
