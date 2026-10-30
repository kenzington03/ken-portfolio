// Ten years as a real horizontal timeline. Vertical scroll drives the track
// sideways; the year counter, the active role and the progress line are all
// the same number (scroll progress), so they can never disagree.

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { NOW, ROLES, SKILLS } from '../../../data/about.js';
import styles from '../Intro3.module.css';

const START = 2015;
const NOW_YEAR = 2026.75; // where the "Now" tick sits
const FOCUS_END = 2025.3; // scroll ends with the Milestone card in focus
const YEARS = Array.from({ length: Math.floor(NOW_YEAR) - START + 1 }, (_, i) => START + i);
const CHRONO = [...ROLES].reverse(); // oldest first
const endOf = (r) => (r.to === null ? NOW_YEAR : r.to);
const midOf = (r) => (r.from + endOf(r)) / 2;
// The year under the "focus line" (30% from the left) is the one the visitor is reading.
const FOCUS_X = 0.3;

function useYearWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 300 : Math.max(240, Math.min(340, window.innerWidth * 0.2))));
  useEffect(() => {
    const on = () => setW(Math.max(240, Math.min(340, window.innerWidth * 0.2)));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

export default function Timeline() {
  const ref = useRef(null);
  const yw = useYearWidth();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);

  const span = FOCUS_END - START;
  const x = useTransform(p, (v) => -v * span * yw);
  const yearText = useTransform(p, (v) => (v > 0.985 ? 'Now' : String(Math.floor(START + v * span + 0.0001))));
  const fill = useTransform(p, [0, 1], [0, 1]);
  const nowOpacity = useTransform(p, [0.9, 0.98], [0, 1]);

  useMotionValueEvent(p, 'change', (v) => {
    const year = START + v * span;
    let idx = 0;
    CHRONO.forEach((r, i) => {
      if (year >= r.from - 0.05) idx = i;
    });
    setActive((cur) => (cur === idx ? cur : idx));
  });

  const vw = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const pad = vw * FOCUS_X;
  const trackW = pad + (NOW_YEAR - START) * yw + vw * (1 - FOCUS_X);

  return (
    <section id="timeline" ref={ref} className={styles.timeline} aria-label="Experience timeline">
      <div className={styles.tlSticky}>
        <span className={styles.sectionTag}>02 / Experience</span>
        <motion.div className={styles.tlYear} aria-live="off">
          {yearText}
        </motion.div>

        <motion.div className={styles.tlTrack} style={{ x, width: trackW }}>
          <div className={styles.tlLine} style={{ left: pad, width: (NOW_YEAR - START) * yw }} />
          {YEARS.map((y) => (
            <span key={y} className={styles.tlTick} style={{ left: pad + (y - START) * yw }}>
              <i />
              <b>{y}</b>
            </span>
          ))}
          <span className={styles.tlTick} style={{ left: pad + (NOW_YEAR - START) * yw }}>
            <i />
            <b>Now</b>
          </span>
          {CHRONO.map((r, i) => {
            const up = i % 2 === 0;
            const big = r.to === null;
            return (
              <article
                key={r.company}
                className={`${styles.tlCard} ${up ? styles.tlUp : styles.tlDown} ${big ? styles.tlBig : ''} ${i === active ? styles.tlActive : ''}`}
                style={{ left: pad + (midOf(r) - START) * yw }}
              >
                <span className={styles.tlDates}>{r.dates}</span>
                <h3>{r.company}</h3>
                <p>{r.role}</p>
                {big && (
                  <ul className={styles.tlSkills}>
                    {SKILLS.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </motion.div>

        <motion.p className={styles.tlNow} style={{ opacity: nowOpacity }}>
          {NOW}
        </motion.p>
        <div className={styles.tlRail}>
          <motion.span style={{ scaleX: fill }} />
        </div>
      </div>
    </section>
  );
}
