import * as THREE from 'three';
import { ease, ramp } from '../Intro/introTimeline.js';

/* v3: the MacBook gets its own scroll runway, so these beats run on
   `macProgress` (0 at the start of the runway, 1 at the end of the page).
   The Rig is unchanged from v1/v2; only the chapter words are new. */
// The chapters take most of the runway (each word lands, then its caption a
// scroll later); the lid, the wake and the dive follow.
export const BEATS = {
  orbit: [0, 0.74],
  lid: [0.68, 0.83],
  wake: [0.77, 0.87],
  dive: [0.87, 0.98],
};

export const HANDOFF_AT = 0.975;

// Where the journey rests on each word, its caption in: one scroll each.
// Shut Down glides back to the last one.
export const CHAPTER_STOPS = [0.18, 0.41, 0.645];

// The three things Ken does (src/data/services.js), one per chapter. The
// colours tint the room's glow; the journey sets them to its palette.
export const CHAPTERS = [
  { id: 'brand', word: 'Brand', from: 0.03, to: 0.26, color: '#5b2fd6', caption: 'Identity systems, logos, guidelines, naming, packaging, websites.' },
  { id: 'campaigns', word: 'Campaigns', from: 0.26, to: 0.49, color: '#ffc21a', caption: 'Campaign strategy, creative direction, leading teams, social, events.' },
  { id: 'motion', word: 'Motion', from: 0.49, to: 0.72, color: '#5b2fd6', caption: 'Video shoots, editing, motion graphics, AI video and content.' },
];

/** Tints the chapters (and so the room's glow) with the journey's palette. */
export function tintChapters(colors) {
  CHAPTERS.forEach((ch, i) => {
    ch.color = colors[i % colors.length];
  });
}

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
