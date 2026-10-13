import * as THREE from 'three';
import { ease, ramp } from '../Intro/introTimeline.js';

/* v3: the MacBook gets its own scroll runway, so these beats run on
   `macProgress` (0 at the start of the runway, 1 at the end of the page).
   The Rig is unchanged from v1/v2; only the chapter words are new. */
export const BEATS = {
  orbit: [0, 0.7],
  lid: [0.62, 0.78],
  wake: [0.7, 0.82],
  dive: [0.82, 0.97],
};

export const HANDOFF_AT = 0.965;

export const CHAPTERS = [
  {
    id: 'build',
    word: 'Build',
    from: 0.04,
    to: 0.26,
    color: '#3d7bff',
    caption: 'Brands from zero. Fluid AI, Truearte, Step-Set-Go, Sampoorna.',
  },
  {
    id: 'move',
    word: 'Move',
    from: 0.26,
    to: 0.47,
    color: '#ff3d8b',
    caption: 'Campaigns that move. Films and event visuals for Milestone’s Momentum 2026.',
  },
  {
    id: 'ship',
    word: 'Ship',
    from: 0.47,
    to: 0.68,
    color: '#ffb224',
    caption: 'Interfaces that ship. Including this one.',
  },
];

export const HERO_COLOR = '#7a8cff';

export const POSES = {
  hero: { yaw: -2.5, pitch: 0.3, radius: 12.5, target: new THREE.Vector3(1.8, 0.45, -1.35) },
  front: { yaw: 0, pitch: 0.12, radius: 9.4, target: new THREE.Vector3(0, 0.3, 0) },
};

export { ease, ramp };

export function chapterAt(p) {
  for (let i = CHAPTERS.length - 1; i >= 0; i -= 1) {
    if (p >= CHAPTERS[i].from) return { index: i, t: ramp(p, CHAPTERS[i].from, CHAPTERS[i].to) };
  }
  return { index: -1, t: 0 };
}

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
export function roomColor(p, out = new THREE.Color()) {
  const { index, t } = chapterAt(p);
  const from = index <= 0 ? HERO_COLOR : CHAPTERS[index - 1].color;
  const to = index < 0 ? HERO_COLOR : CHAPTERS[index].color;
  tmpA.set(from);
  tmpB.set(to);
  return out.copy(tmpA).lerp(tmpB, ease(Math.min(1, t / 0.3)));
}
