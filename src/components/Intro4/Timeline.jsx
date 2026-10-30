// Ten years on a lens ruler. Vertical scroll pans the ruler sideways; the
// year counter is an odometer whose digits roll with the same number, so
// counter, ruler, progress and active card can never disagree, in either
// direction. Everything reads one motion value; React re-renders only when
// the active role changes.

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ROLES, SKILLS } from '../../data/about.js';
import styles from './Intro4.module.css';

const START = 2015;
const NOW_YEAR = 2026.75;
const END = 2025.4; // scroll ends with the current role under the focus line
const FOCUS = 0.34; // focus line, fraction of viewport width
const CHRONO = [...ROLES].reverse();
const endOf = (r) => (r.to === null ? NOW_YEAR : r.to);
const midOf = (r) => (r.from + endOf(r)) / 2;
const YEARS = Array.from({ length: Math.floor(NOW_YEAR) - START + 1 }, (_, i) => START + i);
const ROLL = 0.22; // the last 22% of each year is when digits roll

const smooth = (t) => t * t * (3 - 2 * t);

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}

/** One odometer wheel. `place` is 1, 10, 100 or 1000. */
function Wheel({ year, place }) {
  const y = useTransform(year, (v) => {
    const whole = Math.floor(v);
    const f = v - whole;
    const roll = f > 1 - ROLL ? smooth((f - (1 - ROLL)) / ROLL) : 0;
    const digit = Math.floor(whole / place) % 10;
    // A wheel moves only while every wheel to its right is passing 9 → 0.
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

export default function Timeline() {
  const ref = useRef(null);
  const { w: vw } = useViewport();
  const yw = Math.max(240, Math.min(360, vw * 0.23));
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const span = END - START;
  const year = useTransform(p, (v) => START + Math.min(1, Math.max(0, v)) * span);
  const x = useTransform(year, (v) => -(v - START) * yw);
  const fill = useTransform(year, (v) => (v - START) / (NOW_YEAR - START));
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState(START);

  useMotionValueEvent(year, 'change', (v) => {
    let idx = 0;
    CHRONO.forEach((r, i) => {
      if (v >= r.from - 0.15) idx = i;
    });
    setActive((c) => (c === idx ? c : idx));
    const yr = Math.floor(v);
    setLabel((c) => (c === yr ? c : yr));
  });

  const pad = vw * FOCUS;
  const trackW = pad + (NOW_YEAR - START) * yw + vw;
  const pos = (yr) => pad + (yr - START) * yw;

  return (
    <section id="timeline" ref={ref} className={styles.timeline} aria-label="Experience">
      <div className={styles.tlSticky}>
        <h2 className={styles.tlTitle}>Ten years, five teams.</h2>

        <div className={styles.odometer} aria-hidden>
          <Wheel year={year} place={1000} />
          <Wheel year={year} place={100} />
          <Wheel year={year} place={10} />
          <Wheel year={year} place={1} />
        </div>
        <span className={styles.srOnly} aria-live="off">
          {label}
        </span>

        <div className={styles.focusLine} style={{ left: pad }} aria-hidden />

        <motion.div className={styles.tlTrack} style={{ x, width: trackW }}>
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

          <ol className={styles.roles}>
            {CHRONO.map((r, i) => {
              const now = r.to === null;
              const left = pos(r.from);
              const width = (endOf(r) - r.from) * yw;
              const card = (midOf(r) - r.from) * yw;
              return (
                <li
                  key={r.company}
                  className={`${styles.role} ${i % 2 ? styles.roleHigh : styles.roleLow} ${i === active ? styles.roleOn : ''} ${now ? styles.roleNow : ''}`}
                  style={{ left, '--span': `${width}px`, '--mid': `${card}px` }}
                  aria-current={i === active ? 'step' : undefined}
                >
                  <span className={styles.roleSpan} aria-hidden />
                  <div className={styles.roleCard}>
                    <span className={styles.roleDates}>{r.dates.replace(', ', '-')}</span>
                    <h3>{r.company}</h3>
                    <p>{r.role}</p>
                    {now && (
                      <ul className={styles.skills}>
                        {SKILLS.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
