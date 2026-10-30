import * as THREE from 'three';
import { ease, ramp } from '../Intro/introTimeline.js';

/* v2 runs on one 0→1 scroll progress, like v1, but longer: a hero beat,
   three Dogstudio-style chapters where the room recolours, then the lid,
   the wake and the dive into the screen. */
export const BEATS = {
  orbit: [0, 0.7],
  lid: [0.62, 0.78],
  wake: [0.7, 0.82],
  dive: [0.82, 0.97],
};

export const HANDOFF_AT = 0.965;

/** Hero copy scrolls off over this slice; chapters start as it clears. */
export const HERO_OUT = [0, 0.12];

export const CHAPTERS = [
  {
    id: 'brand',
    word: 'Brand',
    from: 0.13,
    to: 0.33,
    color: '#3d7bff',
    caption: 'Identities for Fluid AI, Truearte, Step-Set-Go and Sampoorna.',
  },
  {
    id: 'motion',
    word: 'Motion',
    from: 0.33,
    to: 0.52,
    color: '#ff3d8b',
    caption: 'Campaign films and event visuals for Milestone’s Momentum 2026.',
  },
  {
    id: 'interfaces',
    word: 'Interfaces',
    from: 0.52,
    to: 0.68,
    color: '#ffb224',
    caption: 'Web and product UI for e-commerce and service brands. Including this one.',
  },
];

/** Room colour before the first chapter starts. */
export const HERO_COLOR = '#7a8cff';

/* Camera: starts behind the closed laptop (its logo toward us), aimed to
   its screen-left so the laptop sits in the right half beside the name, sweeps
   ~150° round the side through the chapters, ends square-on for the dive. */
export const POSES = {
  hero: { yaw: -2.5, pitch: 0.3, radius: 12.5, target: new THREE.Vector3(1.8, 0.45, -1.35) },
  front: { yaw: 0, pitch: 0.12, radius: 9.4, target: new THREE.Vector3(0, 0.3, 0) },
};

export { ease, ramp } from '../Intro/introTimeline.js';

/**
 * Which chapter owns progress `p`, and how far into it we are.
 * index -1 = the hero, before the first chapter.
 */
export function chapterAt(p) {
  for (let i = CHAPTERS.length - 1; i >= 0; i -= 1) {
    if (p >= CHAPTERS[i].from) return { index: i, t: ramp(p, CHAPTERS[i].from, CHAPTERS[i].to) };
  }
  return { index: -1, t: 0 };
}

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
/** Room colour at `p`: blends into each chapter over its first 30%. */
export function roomColor(p, out = new THREE.Color()) {
  const { index, t } = chapterAt(p);
  const from = index <= 0 ? HERO_COLOR : CHAPTERS[index - 1].color;
  const to = index < 0 ? HERO_COLOR : CHAPTERS[index].color;
  tmpA.set(from);
  tmpB.set(to);
  return out.copy(tmpA).lerp(tmpB, ease(Math.min(1, t / 0.3)));
}
