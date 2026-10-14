// The career, as an editorial chart on paper. One hairline ruler runs past
// the right edge of the screen; scrolling inks it in from 2015, the view
// panning to follow the tip, and each role arrives as it is reached: the
// company, Ken's title there and the years, on a stem down to where it
// started. At the end the camera zooms in on Now, dead centre, where the
// journey cuts to the dark. Ink only; the role you are on takes the accent.

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
const yearOf = (v) => Math.floor(v + 0.05);
const years = (r) => {
  const a = yearOf(r.from);
  if (r.to === null) return `${a} to now`;
  const b = yearOf(r.to - 0.1);
  return a === b ? `${a}` : `${a} to ${b}`;
};

// The fill (and pan) runs over most of the scroll, the zoom over the rest.
const FILL_END = 0.78;
const ZOOM = 2.2;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t) => t * t * (3 - 2 * t);
const ROLL = 0.22;

const yearAt = (p) => FIRST + (NOW_YEAR - FIRST) * inOut(within(p, 0, FILL_END));

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

/** The chart's geometry for the current viewport. The grid behind the
 *  journey uses the same numbers: one cell per year, lines through the year
 *  ticks and the ruler. */
export function timelineLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 700;
  const gutter = Math.min(56, Math.max(20, vw * 0.036));
  const yearW = narrow ? 118 : Math.max(170, vw * 0.13);
  const left = narrow ? 28 : Math.max(96, vw * 0.1);
  const x = (yr) => left + (yr - START) * yearW;
  const rulerY = Math.round(vh * (narrow ? 0.62 : 0.66));
  return { vw, vh, narrow, gutter, yearW, left, x, rulerY };
}

/** Where the camera scales from: Now, on the ruler (unpanned coordinates). */
export const timelineOrigin = (g) => `${g.x(NOW_YEAR)}px ${g.rulerY}px`;

/** The camera at timeline progress `p`: pans to follow the tip, which ends
 *  dead centre on Now, then zooms in on it. */
export function timelineCamera(g, p) {
  const f = within(p, 0, FILL_END);
  const tipX = g.x(yearAt(p));
  const focus = 0.56 - 0.06 * within(f, 0.8, 1);
  const pan = Math.min(0, focus * g.vw - tipX);
  const z = inOut(within(p, FILL_END, 1));
  return `translate3d(${pan.toFixed(2)}px, 0, 0) scale(${(1 + (ZOOM - 1) * z).toFixed(4)})`;
}

/**
 * `progress` 0..1 runs the fill and pan, then the zoom into Now; `fade` 0..1
 * clears the chart as the journey cuts to the dark.
 */
export default function TimelineC({ progress, fade }) {
  const [g, setG] = useState(timelineLayout);
  useLayoutEffect(() => {
    const on = () => setG(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const year = useTransform(progress, yearAt);
  const camera = useTransform(progress, (p) => timelineCamera(g, p));
  const zoom = useTransform(progress, (p) => inOut(within(p, FILL_END, 1)));
  const inked = useTransform(year, (v) => g.x(v) - g.left);
  const tipX = useTransform(year, (v) => g.x(v));
  // The ball keeps its size while the camera zooms (it becomes the iris).
  const tipScale = useTransform(zoom, (z) => 1 / (1 + (ZOOM - 1) * z));
  const rolesOpacity = useTransform(zoom, (z) => 1 - within(z, 0.2, 0.65));
  const chrome = useTransform([zoom, fade], ([z, f]) => (1 - within(z, 0.5, 1)) * (1 - f));
  const chart = useTransform(fade, (f) => 1 - f);

  const [shown, setShown] = useState(0);
  const [current, setCurrent] = useState(START);
  useMotionValueEvent(year, 'change', (v) => {
    const n = CHRONO.filter((r) => v >= r.from).length;
    setShown((c) => (c === n ? c : n));
    const y = yearOf(v);
    setCurrent((c) => (c === y ? c : y));
  });

  const tierGap = g.narrow ? 104 : 118;

  return (
    <div className={styles.tl} style={{ '--ruler-y': `${g.rulerY}px` }}>
      <motion.div className={styles.head} style={{ opacity: chrome }}>
        <div className={styles.odometer} aria-hidden>
          <Wheel year={year} place={1000} />
          <Wheel year={year} place={100} />
          <Wheel year={year} place={10} />
          <Wheel year={year} place={1} />
        </div>
        <h2 className={styles.title}>Ten years, six teams.</h2>
      </motion.div>

      <motion.div className={styles.camera} style={{ transform: camera, transformOrigin: timelineOrigin(g), opacity: chart }}>
        {/* The ruler: a hairline the whole way, inked up to the tip. */}
        <div className={styles.ruler} style={{ left: g.left, width: g.x(NOW_YEAR) - g.left + g.vw * 0.2 }}>
          <motion.span className={styles.inked} style={{ width: inked }} />
        </div>

        {YEARS.map((y) => (
          <span key={y} className={`${styles.year} ${y === current ? styles.yearOn : ''}`} style={{ left: g.x(y) }}>
            <b>{y}</b>
          </span>
        ))}
        <span className={`${styles.year} ${styles.yearNow} ${current >= 2026 ? styles.yearOn : ''}`} style={{ left: g.x(NOW_YEAR) }}>
          <b>Now</b>
        </span>

        <motion.ol className={styles.roles} style={{ opacity: rolesOpacity }}>
          {CHRONO.map((r, i) => {
            const on = i < shown;
            const active = i === shown - 1;
            const lift = i % 2 === 0 ? 26 : 26 + tierGap;
            return (
              <li key={r.company} className={`${styles.role} ${active ? styles.roleOn : ''}`} style={{ left: g.x(r.from) }} aria-current={active ? 'step' : undefined}>
                {/* Its years, laid on the ruler. */}
                <motion.span
                  className={styles.span}
                  style={{ width: g.x(endOf(r)) - g.x(r.from) }}
                  initial={false}
                  animate={{ scaleX: on ? 1 : 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* The stem, from the ruler up to the label. */}
                <motion.span
                  className={styles.stem}
                  style={{ height: lift }}
                  initial={false}
                  animate={{ scaleY: on ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.div
                  className={styles.label}
                  style={{ bottom: lift + 8 }}
                  initial={false}
                  animate={on ? { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' } : { opacity: 0, y: 16, clipPath: 'inset(100% 0% 0% 0%)' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: on ? 0.12 : 0 }}
                >
                  <h3>{r.company}</h3>
                  <p className={styles.title_}>{r.role}</p>
                  <p className={styles.when}>{years(r)}</p>
                </motion.div>
              </li>
            );
          })}
        </motion.ol>

        <motion.span className={styles.tip} style={{ left: tipX, scale: tipScale }} aria-hidden />
      </motion.div>
    </div>
  );
}
