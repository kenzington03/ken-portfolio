// Q2: who Ken is, in one paragraph with its receipts. The words write
// themselves as the section arrives (driven by the journey's scroll, so it
// plays back exactly when scrolling up), and each claim's proof, a small
// rounded thumbnail of the work, pops in right beside its words.
//
// Thumbnails are the phone-sized covers for now; Ken is sending the right
// images (his B2B brand work and the campaigns) to drop in here.

import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import styles from './MePanel.module.css';

// The paragraph: strings are words, objects are thumbnails (`img`, what it
// shows). `hello` is the first line, `aside` the quiet last one.
export const STORY = [
  { kind: 'hello', parts: ["Hey, I'm Ken."] },
  {
    kind: 'line',
    parts: ["For ten years I've built brands", { img: '/assets/phone/work/fluid-ai.webp', alt: 'Fluid AI brand work' }, 'for B2B tech, pharma, crypto and finance.'],
  },
  {
    kind: 'line',
    parts: [
      'I start with the idea and the strategy, then design campaigns',
      { img: '/assets/phone/work/social-media.webp', alt: 'Campaign work' },
      'built to make a real impact.',
    ],
  },
  { kind: 'line', parts: ["I can't look at a design without asking how it could be better."] },
  { kind: 'aside', parts: ['Off the screen: basketball, chess, and whatever sparks my curiosity next.'] },
]

// Every word and thumbnail in order, so each gets its turn as the scroll
// writes the paragraph.
const flatten = () => {
  let n = 0;
  return STORY.map((line) => ({
    ...line,
    tokens: line.parts.flatMap((p) => (typeof p === 'string' ? p.split(' ').map((w) => ({ word: w, i: n++ })) : [{ ...p, i: n++ }])),
  }));
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));

/**
 * `progress` is the journey's scroll; `span` [a, b] is where the paragraph
 * writes itself; `arrive` [a, b] the whole crossing from the hero, for the
 * depth. `instant` shows it written. `onSeeWork` opens the Portfolio.
 */
export default function MePanel({ progress, span, arrive, instant, wide, onSeeWork }) {
  const rootRef = useRef(null);
  const lines = useMemo(flatten, []);
  const total = lines.reduce((n, l) => n + l.tokens.length, 0);

  const write = (v) => {
    const root = rootRef.current;
    if (!root) return;
    const t = instant ? 1 : within(v, span[0], span[1]);
    const e = instant ? 1 : within(v, arrive[0], arrive[1]);
    root.style.setProperty('--e', (1 - e).toFixed(4));
    // How many words are written (with a soft edge of three words).
    root.style.setProperty('--w', (t * (total + 3)).toFixed(3));
  };
  useMotionValueEvent(progress, 'change', write);
  useEffect(() => write(progress.get()));

  return (
    <section ref={rootRef} className={`${styles.me} ${wide ? styles.wide : ''}`} aria-label="About Ken">
      <div className={styles.story}>
        {lines.map((line, li) => {
          const Tag = line.kind === 'hello' ? 'h2' : 'p';
          return (
            <Tag key={li} className={styles[line.kind]}>
              {line.tokens.map((tk, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  {tk.word != null ? (
                    <span className={styles.word} style={{ '--i': tk.i }}>
                      {tk.word}
                    </span>
                  ) : (
                    <button type="button" className={styles.thumb} style={{ '--i': tk.i }} onClick={onSeeWork} aria-label={`${tk.alt}. Open the Portfolio`}>
                      <img src={tk.img} alt="" draggable={false} />
                    </button>
                  )}
                </Fragment>
              ))}
            </Tag>
          );
        })}
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
