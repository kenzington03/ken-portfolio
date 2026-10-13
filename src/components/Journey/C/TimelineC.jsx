// The v4 career ruler Ken asked to keep: an odometer year that rolls with the
// scroll, a lens ruler sliding under an orange focus line, the active stint
// in ink. A gist only: company and years (verified against LinkedIn), no
// titles. It is a deck panel now: the deck hands it a 0..1 `progress`.
// (Styles are v4's; the journey root supplies the same CSS variables.)

import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'framer-motion';
import { ROLES } from '../../../data/about.js';
import styles from '../../Intro4/Intro4.module.css';

const START = 2015;
const FIRST = 2015.5; // where the scroll begins (Ken's first stint starts Aug 2015)
const NOW_YEAR = 2026.75;
const END = 2025.4;
const FOCUS = 0.34;
const CHRONO = [...ROLES].reverse();
const endOf = (r) => (r.to === null ? NOW_YEAR : r.to);
const midOf = (r) => (r.from + endOf(r)) / 2;
const YEARS = Array.from({ length: Math.floor(NOW_YEAR) - START + 1 }, (_, i) => START + i);
const ROLL = 0.22;
const smooth = (t) => t * t * (3 - 2 * t);
const yearOf = (v) => Math.floor(v + 0.05);
const years = (r) => {
  const a = yearOf(r.from);
  if (r.to === null) return `${a} to now`;
  const b = yearOf(r.to - 0.1);
  return a === b ? `${a}` : `${a} to ${b}`;
};

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

/**
 * `progress` 0..1 runs the ten years. `tail` 0..1 then carries the ruler on
 * until the Now marker sits at the centre of the screen, while `fade` 0..1
 * clears everything else away: the deck grows the laptop out of that marker.
 */
export default function TimelineC({ progress, tail, fade }) {
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const yw = Math.max(240, Math.min(360, vw * 0.23));
  // Years the ruler still has to travel for Now to reach the screen's centre.
  const tailYears = NOW_YEAR - END - ((0.5 - FOCUS) * vw) / yw;
  const year = useTransform([progress, tail], ([v, t]) => FIRST + Math.min(1, Math.max(0, v)) * (END - FIRST) + t * tailYears);
  const chrome = useTransform(fade, (f) => 1 - f);
  const rulerOpacity = useTransform(fade, (f) => 1 - Math.max(0, (f - 0.55) / 0.45));
  const x = useTransform(year, (v) => -(v - START) * yw);
  const fill = useTransform(year, (v) => (v - START) / (NOW_YEAR - START));
  const [active, setActive] = useState(0);

  useMotionValueEvent(year, 'change', (v) => {
    let idx = 0;
    CHRONO.forEach((r, i) => {
      if (v >= r.from - 0.12) idx = i;
    });
    setActive((c) => (c === idx ? c : idx));
  });

  const pad = vw * FOCUS;
  const trackW = pad + (NOW_YEAR - START) * yw + vw;
  const pos = (yr) => pad + (yr - START) * yw;

  return (
    <div className={styles.tlSticky} style={{ position: 'absolute', inset: 0, height: 'auto' }}>
      <motion.h2 className={styles.tlTitle} style={{ opacity: chrome }}>
        Ten years, six teams.
      </motion.h2>
      <motion.div className={styles.odometer} style={{ opacity: chrome }} aria-hidden>
        <Wheel year={year} place={1000} />
        <Wheel year={year} place={100} />
        <Wheel year={year} place={10} />
        <Wheel year={year} place={1} />
      </motion.div>
      <motion.div className={styles.focusLine} style={{ left: pad, opacity: chrome }} aria-hidden />

      <motion.div className={styles.tlTrack} style={{ x, width: trackW, opacity: rulerOpacity }}>
        <div className={styles.ruler} style={{ left: pad, width: (NOW_YEAR - START) * yw }}>
          <motion.span className={styles.rulerFill} style={{ scaleX: fill }} />
        </div>
        {YEARS.map((y) => (
          <span key={y} className={styles.tick} style={{ left: pos(y) }}>
            <b>{y}</b>
          </span>
        ))}
        {YEARS.flatMap((y) => [0.25, 0.5, 0.75].map((q) => y + q))
          .filter((v) => v < NOW_YEAR)
          .map((v) => (
            <span key={v} className={styles.tickMinor} style={{ left: pos(v) }} />
          ))}
        <span className={`${styles.tick} ${styles.tickNow}`} style={{ left: pos(NOW_YEAR) }}>
          <b>Now</b>
        </span>

        <motion.ol className={styles.roles} style={{ opacity: chrome }}>
          {CHRONO.map((r, i) => (
            <li
              key={r.company}
              className={`${styles.role} ${i % 2 ? styles.roleHigh : styles.roleLow} ${i === active ? styles.roleOn : ''}`}
              style={{ left: pos(r.from), '--span': `${(endOf(r) - r.from) * yw}px`, '--mid': `${(midOf(r) - r.from) * yw}px` }}
              aria-current={i === active ? 'step' : undefined}
            >
              <span className={styles.roleSpan} aria-hidden />
              <div className={styles.roleCard} style={{ width: 250 }}>
                <h3 style={{ marginTop: 0 }}>{r.company}</h3>
                <p>{years(r)}</p>
              </div>
            </li>
          ))}
        </motion.ol>
      </motion.div>
    </div>
  );
}
