// Ten years in one frame, quietly. A hairline ruler spans the screen with a
// small tick per year and a dot where each job began. Scrolling inks the
// line from 2015 to Now, a ball riding the tip; only the job the ball is on
// is written out: the company large above the ball, Ken's title and the
// years below it. The words travel with the ball and change with a short
// slide as it passes each start, so nothing can ever overlap. A faint year
// sits large behind it all. At the end the camera zooms in on Now, dead
// centre, where the journey cuts to the dark.

import { useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { ROLES } from '../../../data/about.js';
import styles from './Timeline.module.css';

const START = 2015;
const NOW_YEAR = 2026.75;
const FIRST = 2015.6; // the first job starts here, so there is always one to show
const CHRONO = [...ROLES].reverse();
const YEARS = Array.from({ length: Math.floor(NOW_YEAR) - START + 1 }, (_, i) => START + i);
const yearOf = (v) => Math.floor(v + 0.05);
const years = (r) => {
  const a = yearOf(r.from);
  if (r.to === null) return `${a} to now`;
  const b = yearOf(r.to - 0.1);
  return a === b ? `${a}` : `${a} to ${b}`;
};

// The fill runs over most of the scroll, the zoom over the rest.
const FILL_END = 0.8;
const ZOOM = 2.4;
const EASE = [0.16, 1, 0.3, 1];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const yearAt = (p) => FIRST + (NOW_YEAR - FIRST) * inOut(within(p, 0, FILL_END));

/** The chart's geometry for the current viewport. The grid behind the
 *  journey uses the same numbers: one cell per year, lines through the year
 *  ticks and the ruler. */
export function timelineLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 700;
  const gutter = Math.min(56, Math.max(20, vw * 0.036));
  const left = narrow ? 24 : Math.max(72, vw * 0.08);
  const right = vw - left;
  const yearW = (right - left) / (NOW_YEAR - START);
  const x = (yr) => left + (yr - START) * yearW;
  const rulerY = Math.round(vh * 0.56);
  const labelW = narrow ? Math.min(300, vw - 48) : Math.min(520, vw * 0.36);
  return { vw, vh, narrow, gutter, yearW, left, right, x, rulerY, labelW };
}

/** Where the camera scales from: Now, on the ruler. */
export const timelineOrigin = (g) => `${g.x(NOW_YEAR)}px ${g.rulerY}px`;

/** The camera at timeline progress `p`: still while the line fills, then a
 *  zoom into Now that slides it to the centre of the screen. */
export function timelineCamera(g, p) {
  const z = inOut(within(p, FILL_END, 1));
  const tx = (g.vw / 2 - g.x(NOW_YEAR)) * z;
  return `translate3d(${tx.toFixed(2)}px, 0, 0) scale(${(1 + (ZOOM - 1) * z).toFixed(4)})`;
}

/**
 * `progress` 0..1 runs the fill, then the zoom into Now; `fade` 0..1 clears
 * the chart as the journey cuts to the dark.
 */
export default function TimelineC({ progress, fade }) {
  const [g, setG] = useState(timelineLayout);
  useLayoutEffect(() => {
    const on = () => setG(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const year = useTransform(progress, yearAt);
  const zoom = useTransform(progress, (p) => inOut(within(p, FILL_END, 1)));
  const camera = useTransform(progress, (p) => timelineCamera(g, p));
  const inked = useTransform(year, (v) => g.x(v) - g.left);
  const tipX = useTransform(year, (v) => g.x(v));
  // The words follow the ball, kept on screen.
  const labelX = useTransform(year, (v) => Math.min(Math.max(g.x(v) - 18, g.left - 18), g.right - g.labelW + 18));
  // The ball keeps its size while the camera zooms (it becomes the iris).
  const tipScale = useTransform(zoom, (z) => 1 / (1 + (ZOOM - 1) * z));
  const words = useTransform(zoom, (z) => 1 - within(z, 0.1, 0.5));
  const chart = useTransform(fade, (f) => 1 - f);
  const ghost = useTransform([zoom, fade], ([z, f]) => (1 - within(z, 0, 0.6)) * (1 - f));

  const [active, setActive] = useState(0);
  const [current, setCurrent] = useState(START);
  useMotionValueEvent(year, 'change', (v) => {
    const n = Math.max(0, CHRONO.filter((r) => v >= r.from - 0.02).length - 1);
    setActive((c) => (c === n ? c : n));
    const y = yearOf(v);
    setCurrent((c) => (c === y ? c : y));
  });
  const role = CHRONO[active];

  return (
    <div className={styles.tl} style={{ '--ruler-y': `${g.rulerY}px` }}>
      <h2 className={styles.title}>Ten years, six teams.</h2>
      {/* The year, very large and very faint, behind everything. */}
      <motion.p className={styles.ghost} style={{ opacity: ghost }} aria-hidden>
        {current}
      </motion.p>

      <motion.div className={styles.camera} style={{ transform: camera, transformOrigin: timelineOrigin(g), opacity: chart }}>
        <div className={styles.ruler} style={{ left: g.left, width: g.right - g.left }}>
          <motion.span className={styles.inked} style={{ width: inked }} />
        </div>

        {YEARS.map((y) => (
          <span key={y} className={`${styles.tick} ${y <= current ? styles.tickPast : ''} ${y === current ? styles.tickOn : ''}`} style={{ left: g.x(y) }}>
            {(!g.narrow || y % 2 === 1) && <b>{y}</b>}
          </span>
        ))}
        <span className={`${styles.tick} ${styles.tickNow}`} style={{ left: g.x(NOW_YEAR) }}>
          <b>Now</b>
        </span>

        {/* Where each job began: a small dot that fills once reached. */}
        {CHRONO.map((r, i) => (
          <span key={r.company} className={`${styles.start} ${i <= active ? styles.startOn : ''}`} style={{ left: g.x(r.from) }} aria-hidden />
        ))}

        <motion.span className={styles.tip} style={{ left: tipX, scale: tipScale }} aria-hidden />
      </motion.div>

      {/* The job the ball is on: company above the line, title and years below. */}
      <motion.div className={styles.now} style={{ x: labelX, width: g.labelW, opacity: words }} aria-live="polite">
        <div className={styles.above}>
          <AnimatePresence initial={false}>
            <motion.h3
              key={role.company}
              className={styles.company}
              initial={{ y: '60%', opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-40%', opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {role.company}
            </motion.h3>
          </AnimatePresence>
        </div>
        <div className={styles.below}>
          <AnimatePresence initial={false}>
            <motion.div
              key={role.company}
              className={styles.detail}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
            >
              <p className={styles.jobTitle}>{role.role}</p>
              <p className={styles.when}>
                {years(role)}
                <span className={styles.count}>
                  {String(active + 1).padStart(2, '0')} of {String(CHRONO.length).padStart(2, '0')}
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
