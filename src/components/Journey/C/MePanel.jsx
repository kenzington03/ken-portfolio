// Q2: selected work. Proof right after the hero: three pieces from the
// Portfolio, in full colour, standing on the line the ball holds, with what
// each one is under the line. The rest is a click away (the Mac's Portfolio).
//
// Everything moves with the journey's one scroll value (no clocks), so it
// plays back exactly when scrolling up; the layers come in at their own
// depths as the section arrives.

import { useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { getProjectBySlug } from '../../../data/projects.js';
import styles from './MePanel.module.css';

export const ME_HEAD = 'Selected work';
export const ME_SUB = 'Three I would show you first. The full archive opens on my Mac.';

// The three, in order. Covers are the phone-sized crops (800 x 500).
export const PICKS = ['fluid-ai', 'marriott', 'lebron-nike']
  .map((slug) => getProjectBySlug(slug))
  .filter(Boolean)
  .map((p) => ({ slug: p.slug, name: p.name, what: `${p.category} · ${p.year}`, cover: `/assets/phone/work/${p.slug}.webp` }));

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));
// Lands with a touch of give, like a print laid down.
const backOut = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

/**
 * `progress` is the journey's scroll; `span` [a, b] is where the section
 * plays; `arrive` [a, b] the whole crossing from the hero, for the depth.
 * `instant` shows it settled. `onSeeWork` opens the Portfolio.
 */
export default function MePanel({ progress, span, arrive, instant, wide, onSeeWork }) {
  const rootRef = useRef(null);
  const cardRefs = useRef([]);

  const write = (v) => {
    const root = rootRef.current;
    if (!root) return;
    const t = instant ? 1 : within(v, span[0], span[1]);
    const e = instant ? 1 : within(v, arrive[0], arrive[1]);
    root.style.setProperty('--e', (1 - e).toFixed(4));
    root.style.setProperty('--head', within(t, 0, 0.32).toFixed(4));
    PICKS.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      const land = within(t, 0.1 + i * 0.1, 0.5 + i * 0.1);
      el.style.setProperty('--land', backOut(land).toFixed(4));
      el.style.setProperty('--seen', Math.min(1, land * 3).toFixed(3));
      el.style.setProperty('--cap', within(t, 0.45 + i * 0.1, 0.7 + i * 0.1).toFixed(4));
    });
  };
  useMotionValueEvent(progress, 'change', write);
  useEffect(() => write(progress.get()));

  return (
    <section ref={rootRef} className={`${styles.me} ${wide ? styles.wide : ''}`} aria-labelledby="me-head">
      <header className={styles.top}>
        <h2 id="me-head" className={styles.head}>
          {ME_HEAD}
        </h2>
        <p className={styles.sub}>{ME_SUB}</p>
      </header>

      <ol className={styles.prints}>
        {PICKS.map((it, i) => (
          <li
            key={it.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={styles.item}
          >
            <button type="button" className={styles.card} onClick={onSeeWork} aria-label={`${it.name}, ${it.what}. Open the Portfolio`}>
              <img src={it.cover} alt="" draggable={false} loading="lazy" />
            </button>
            <p className={styles.caption}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <b>{it.name}</b>
              <span>{it.what}</span>
            </p>
          </li>
        ))}
      </ol>

      {/* The line the ball holds; the way to everything else at its end. */}
      <div className={styles.bar} aria-hidden>
        <span className={styles.barRule} />
      </div>
      <button type="button" className={styles.all} onClick={onSeeWork}>
        See all the work
        <svg viewBox="0 0 20 20" aria-hidden>
          <path d="M4 10h11M11 5l5 5-5 5" />
        </svg>
      </button>
    </section>
  );
}
