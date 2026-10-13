// Generative ambient score, synthesised live with the Web Audio API: no audio
// files, nothing to license, and it can follow the page. A warm detuned pad
// plays one chord per chapter through a breathing low-pass filter, a thin
// bed of tape hiss sits under it, and everything runs into a soft generated
// reverb. Scroll opens the filter a little; chapter changes glide the chord.
// Browsers only allow audio after a user gesture, so `start()` must be
// called from a click (the loader's "Enter with sound", or the toggle).

const CHORDS = [
  [73.42, 110.0, 185.0, 277.18, 329.63], // hero: D maj9
  [61.74, 92.5, 146.83, 220.0, 277.18], // brand: B m9
  [49.0, 73.42, 185.0, 246.94, 277.18], // motion: G maj7#11
  [55.0, 82.41, 138.59, 246.94, 329.63], // interfaces: A add9
];

const MASTER_LEVEL = 0.32;
const FADE_S = 0.6;

function impulse(ctx, seconds = 3.2, decay = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

export class Ambient {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.chord = 0;
    this.depth = 0;
    this.suspendTimer = 0;
  }

  get started() {
    return !!this.ctx;
  }

  /** Build the graph (first call) and fade in. Call from a user gesture. */
  start() {
    if (!this.ctx) this.#build();
    clearTimeout(this.suspendTimer);
    this.ctx.resume?.();
    this.on = true;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(MASTER_LEVEL, t, FADE_S / 3);
    // Depth isn't scheduled while muted: catch the filter up to the scroll.
    this.filter.frequency.setTargetAtTime(520 + this.depth * 1400, t, 0.4);
  }

  stop() {
    if (!this.ctx) return;
    this.on = false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, FADE_S / 4);
    // Once faded out, stop rendering the pad, reverb and hiss altogether.
    clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      if (!this.on) this.ctx?.suspend?.();
    }, FADE_S * 1000);
  }

  /** Glide the pad to chapter `index` (-1 = hero). */
  setChapter(index) {
    const next = index + 1;
    if (next === this.chord) return;
    // Remembered even before the graph exists, so sound that starts
    // mid-chapter plays that chapter's chord.
    this.chord = next;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    CHORDS[next].forEach((f, i) => {
      this.voices[i].forEach((osc, k) => osc.frequency.setTargetAtTime(f * (k ? 1.004 : 0.996), t, 0.9));
    });
  }

  /** 0..1 scroll depth: brighter filter the deeper you go. */
  setDepth(d) {
    // Called every frame: only schedule when the depth actually moved.
    if (Math.abs(d - this.depth) < 0.002) return;
    this.depth = d;
    if (!this.ctx || !this.on) return;
    this.filter.frequency.setTargetAtTime(520 + d * 1400, this.ctx.currentTime, 0.4);
  }

  /** Short soft tick for UI feedback (hover / press). */
  tick(pitch = 1) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(440 * pitch, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g).connect(this.reverbSend);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  /** Camera shutter: two filtered noise clicks (open, close) and a soft body thump. */
  shutter() {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const click = (at, freq, len, level) => {
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.value = level;
      src.connect(bp).connect(g).connect(this.master);
      g.connect(this.reverbSend);
      src.start(t + at);
    };
    click(0, 3200, 0.03, 0.9);
    click(0.085, 1500, 0.06, 0.7);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  dispose() {
    clearTimeout(this.suspendTimer);
    this.ctx?.close();
    this.ctx = null;
  }

  #build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverb.connect(wet).connect(this.master);
    this.reverbSend = reverb;

    // Pad: two slightly detuned saws per chord note → low-pass → reverb.
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 520 + this.depth * 1400;
    this.filter.Q.value = 0.7;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    this.filter.connect(padGain);
    padGain.connect(this.master);
    padGain.connect(reverb);

    // Slow "breathing" on the filter.
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 180;
    lfo.connect(lfoDepth).connect(this.filter.frequency);
    lfo.start();

    this.voices = CHORDS[this.chord].map((f) =>
      [0.996, 1.004].map((detune) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f * detune;
        osc.connect(this.filter);
        osc.start();
        return osc;
      }),
    );

    // Tape hiss: looped noise, band-limited, very low.
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i += 1) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = 3200;
    hissFilter.Q.value = 0.4;
    const hiss = ctx.createGain();
    hiss.gain.value = 0.012;
    noise.connect(hissFilter).connect(hiss).connect(this.master);
    noise.start();
  }
}
