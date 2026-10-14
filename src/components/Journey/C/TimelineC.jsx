// Ten years in one frame. The whole ruler, 2015 to Now, fits the screen;
// scrolling fills it left to right, a white ball riding the tip, and each
// job pops up as the tip reaches it (and stays, so by the end all six are
// there). Then the camera zooms in on Now, sliding it to the centre of the
// screen, where the journey turns the ball into the Apple logo.
// Company and years only (verified against LinkedIn), no titles.

import { useLayoutEffect, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { ROLES } from '../../../data/about.js';
import styles from './Timeline.module.css';

const START = 2015;
const NOW_YEAR = 2026.75;
const FIRST = 2015.3;
const CHRONO = [...ROLES].reverse();
const YEARS = Array.from({ length: Math.floor(NOW_YEAR) - START + 1 }, (_, i) => START + i);
const endOf = (r) => (r.to === null ? NOW_YEAR : r.to);
const midOf = (r) => (r.from + endOf(r)) / 2;
const yearOf = (v) => Math.floor(v + 0.05);
const years = (r) => {
  const a = yearOf(r.from);
  if (r.to === null) return `${a} to now`;
  const b = yearOf(r.to - 0.1);
  return a === b ? `${a}` : `${a} to ${b}`;
};

// The fill runs over the first part of the scroll, the zoom over the rest.
const FILL_END = 0.74;
const ZOOM = 2.6;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const ROLL = 0.22;

function Wheel({ year, place }) {
  const y = useTransform(year, (v) => {
    const whole = Math.floor(v);
    const f = v - whole;
    const roll = f > 1 - ROLL ? smooth((f - (1 - ROLL)) / ROLL) : 0;
    const digit = Math.floor(whole / place) % 10;
    const carrying = place === 1 || whole % place === place - 1;
    return `${(-(digit + (carrying ? roll : 0)) * 100) / 11}%`;
  });
  return (
    <span className={styles.wheel}>
      <motion.span className={styles.wheelStrip} style={{ y }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}

// The ruler's widest on a large screen: compact enough to read as one line.
const MAX_RULER = 1000;
export const ROLE_COLORS = ['var(--blue)', 'var(--pink)', 'var(--yellow)'];

/** Ruler geometry and card positions for the current viewport. The grid
 *  behind the journey uses the same numbers: one cell per year, its lines
 *  through the year ticks and the ruler. */
export function timelineLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 700;
  const span = Math.min(vw - 2 * (narrow ? 22 : Math.max(48, vw * 0.06)), MAX_RULER);
  const left = Math.round((vw - span) / 2);
  const right = left + span;
  const yearW = span / (NOW_YEAR - START);
  const x = (yr) => left + (yr - START) * yearW;
  const cardW = narrow ? 104 : Math.min(220, span / 3.6);
  // Alternate rows above / below the ruler; within a row, cards never
  // overlap and never leave the screen.
  const rows = [[], []];
  CHRONO.forEach((r, i) => rows[i % 2].push({ i, want: x(midOf(r)) - cardW / 2 }));
  const pos = [];
  rows.forEach((row) => {
    let prev = -Infinity;
    row.forEach((c) => {
      c.at = Math.max(c.want, prev + 10, 8);
      prev = c.at + cardW;
    });
    let limit = vw - 8;
    [...row].reverse().forEach((c) => {
      c.at = Math.min(c.at, limit - cardW);
      limit = c.at - 10;
      pos[c.i] = c.at;
    });
  });
  return { vw, vh, narrow, left, right, x, yearW, cardW, pos, rulerY: vh * 0.54 + 71 };
}

/** The camera at zoom `z` (0..1): scales about Now while sliding Now to the centre. */
export function timelineCamera(g, z) {
  const tx = (g.vw / 2 - g.x(NOW_YEAR)) * z;
  return {
    transform: `translate3d(${tx.toFixed(2)}px, 0, 0) scale(${(1 + (ZOOM - 1) * z).toFixed(4)})`,
    origin: `${g.x(NOW_YEAR)}px ${g.rulerY}px`,
  };
}

/** Zoom amount (0..1) for a timeline progress. */
export const timelineZoom = (p) => inOut(within(p, FILL_END, 1));

/**
 * `progress` 0..1 runs the fill, then the zoom into Now; `fade` 0..1 then
 * clears the timeline so the laptop can appear.
 */
export default function TimelineC({ progress, fade }) {
  const [g, setG] = useState(timelineLayout);
  useLayoutEffect(() => {
    const on = () => setG(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const year = useTransform(progress, (p) => FIRST + (NOW_YEAR - FIRST) * inOut(within(p, 0, FILL_END)));
  const zoom = useTransform(progress, timelineZoom);
  const camera = useTransform(zoom, (z) => timelineCamera(g, z).transform);
  // The fill reveals a fixed blue → pink → yellow gradient, so the tip's
  // colour moves through the years.
  const fillClip = useTransform(year, (v) => `inset(0 ${(100 * (1 - (v - START) / (NOW_YEAR - START))).toFixed(3)}% 0 0)`);
  const tipX = useTransform(year, (v) => g.x(v));
  // The ball keeps its size while the camera zooms, so it matches the one
  // that takes over from it.
  const tipScale = useTransform(zoom, (z) => 1 / (1 + (ZOOM - 1) * z));
  // The cards step back as the camera closes in; the ruler goes with the fade.
  const cardsOpacity = useTransform(zoom, (z) => 1 - within(z, 0.25, 0.7));
  const chrome = useTransform(fade, (f) => 1 - f);
  const rulerOpacity = useTransform(fade, (f) => 1 - within(f, 0.55, 1));
  // Once the timeline is done the journey's own ball (same spot, same look)
  // takes over.
  const tipOpacity = useTransform(fade, (f) => (f > 0 ? 0 : 1));

  const [shown, setShown] = useState(0);
  useMotionValueEvent(year, 'change', (v) => {
    const n = CHRONO.filter((r) => v >= r.from).length;
    setShown((c) => (c === n ? c : n));
  });

  return (
    <div className={styles.tl} style={{ '--ruler-y': `${g.rulerY}px` }}>
      <motion.h2 className={styles.tlTitle} style={{ opacity: chrome }}>
        Ten years, six teams.
      </motion.h2>
      <motion.div className={styles.odometer} style={{ opacity: chrome }} aria-hidden>
        <Wheel year={year} place={1000} />
        <Wheel year={year} place={100} />
        <Wheel year={year} place={10} />
        <Wheel year={year} place={1} />
      </motion.div>

      <motion.div className={styles.camera} style={{ transform: camera, transformOrigin: timelineCamera(g, 0).origin }}>
        <motion.div style={{ opacity: rulerOpacity }}>
          <div className={styles.ruler} style={{ left: g.left, width: g.right - g.left }}>
            <motion.span className={styles.rulerFill} style={{ clipPath: fillClip }} />
          </div>
          {YEARS.map((y) => (
            <span key={y} className={styles.tick} style={{ left: g.x(y) }}>
              {(!g.narrow || y % 2 === 1) && <b>{y}</b>}
            </span>
          ))}
          <span className={`${styles.tick} ${styles.tickNow}`} style={{ left: g.x(NOW_YEAR) }}>
            <b>Now</b>
          </span>
        </motion.div>

        <motion.ol className={styles.roles} style={{ opacity: cardsOpacity }}>
          {CHRONO.map((r, i) => {
            const on = i < shown;
            const high = i % 2 === 0;
            const active = i === shown - 1;
            return (
              <li key={r.company} className={styles.role} aria-current={active ? 'step' : undefined}>
                {/* The years the role covers, drawn on the ruler. */}
                <motion.span
                  className={styles.span}
                  style={{ left: g.x(r.from), width: g.x(endOf(r)) - g.x(r.from), background: ROLE_COLORS[i % 3] }}
                  initial={false}
                  animate={{ opacity: on ? (active ? 1 : 0.5) : 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className={`${styles.card} ${high ? styles.cardHigh : styles.cardLow} ${active ? styles.cardOn : ''}`}
                  style={{ left: g.pos[i], width: g.cardW, transformOrigin: `${g.x(midOf(r)) - g.pos[i]}px ${high ? '100%' : '0%'}`, '--role': ROLE_COLORS[i % 3] }}
                  initial={false}
                  animate={on ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: high ? 14 : -14 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <h3>{r.company}</h3>
                  <p>{years(r)}</p>
                </motion.div>
              </li>
            );
          })}
        </motion.ol>

        <motion.span className={styles.tip} style={{ left: tipX, opacity: tipOpacity, scale: tipScale }} aria-hidden />
      </motion.div>
    </div>
  );
}
