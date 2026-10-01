/* The whole intro is one 0→1 scroll progress; every beat is a [start, end]
   slice of it. The DOM hero and the 3D scene both read these, so text and
   camera can never drift out of sync. */
export const BEATS = {
  orbit: [0, 0.5],
  lid: [0.13, 0.46],
  wake: [0.27, 0.49],
  dive: [0.5, 0.9],
};

/** Smoothed progress at which the DOM welcome screen takes over from WebGL. */
export const HANDOFF_AT = 0.965;

export function ramp(p, a, b) {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
}

/** easeInOutCubic */
export function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
