// Proof before the Mac: who Ken has worked with, what teammates say, and
// three numbers that count up once the section is on screen.

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { CLIENTS, STATS } from '../../../data/about.js';
import { KUDOS_QUOTES } from '../../../data/kudosQuotes.js';
import styles from '../Intro3.module.css';

const QUOTES = [KUDOS_QUOTES[4], KUDOS_QUOTES[0]].filter(Boolean);

function CountUp({ to, run, reduced }) {
  const [n, setN] = useState(reduced ? to : 0);
  useEffect(() => {
    if (!run || reduced) {
      if (reduced) setN(to);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      setN(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, to, reduced]);
  return n;
}

export default function Proof({ reduced }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -25% 0px' });
  const loop = [...CLIENTS, ...CLIENTS];
  return (
    <section id="proof" ref={ref} className={styles.proof} aria-label="Proof">
      <span className={styles.sectionTag}>03 / Proof</span>

      <div className={styles.marquee} aria-label={`Worked with ${CLIENTS.join(', ')}`}>
        <div className={styles.marqueeTrack} aria-hidden>
          {loop.map((c, i) => (
            <span key={`${c}-${i}`}>{c}</span>
          ))}
        </div>
      </div>

      <div className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <b>
              <CountUp to={s.value} run={inView} reduced={reduced} />
              {s.suffix}
            </b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.quotes}>
        {QUOTES.map((q) => (
          <figure key={q.quote} className={styles.quote}>
            <blockquote>“{q.quote}”</blockquote>
            <figcaption>
              {q.name}
              <small>{q.role}</small>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
