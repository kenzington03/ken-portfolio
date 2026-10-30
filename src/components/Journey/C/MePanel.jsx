// Q2: who Ken is, and the proof. The paragraph writes itself as the section
// arrives (driven by the journey's scroll, so it plays back exactly when
// scrolling up), and under it a collage of his work builds in step: each
// piece lands as the words it proves are written (the brands with "brands",
// the campaigns with "campaigns", the redesign with "better").

import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import styles from './MePanel.module.css';

export const STORY = [
  { kind: 'hello', text: "Hey, I'm Ken." },
  { kind: 'line', text: "For ten years I've built brands for B2B tech, pharma, crypto and finance." },
  { kind: 'line', text: 'I start with the idea and the strategy, then design campaigns built to make a real impact.' },
  { kind: 'line', text: "I can't look at a design without asking how it could be better." },
  { kind: 'aside', text: 'Off the screen: basketball, chess, and whatever sparks my curiosity next.' },
];

// The collage: where each piece sits in its box (left, top, width as % of
// the box; r its turn; z its layer) and the word it lands with.
export const COLLAGE = [
  { id: 'fluid-ai', alt: 'Fluid AI brand identity', cue: 'brands', ratio: 1, x: 0, y: 4, w: 27, r: -5, z: 2 },
  { id: 'truearte', alt: 'Truearte packaging', cue: 'brands', ratio: 720 / 669, x: 21, y: 38, w: 27, r: 4, z: 3 },
  { id: 'qmart', alt: 'Qmart campaign banner', cue: 'campaigns', ratio: 720 / 431, x: 40, y: 0, w: 36, r: -3, z: 1 },
  { id: 'beatles', alt: 'The Beatles, event artwork', cue: 'campaigns', ratio: 720 / 622, x: 45, y: 40, w: 25, r: 3, z: 4 },
  { id: 'acdc', alt: 'AC/DC, event artwork', cue: 'campaigns', ratio: 720 / 623, x: 66, y: 34, w: 26, r: -4, z: 3 },
  { id: 'lebron', alt: 'A redesign concept around LeBron James', cue: 'better.', ratio: 720 / 450, x: 70, y: 2, w: 30, r: 5, z: 2 },
];

// Every word in order (each gets its turn as the scroll writes), and the
// turn at which each collage piece lands (its cue word's, staggered).
const build = () => {
  let n = 0;
  const lines = STORY.map((line) => ({ ...line, words: line.text.split(' ').map((w) => ({ w, i: n++ })) }));
  const at = (word) => lines.flatMap((l) => l.words).find((x) => x.w === word)?.i ?? 0;
  const seen = {};
  const pieces = COLLAGE.map((p) => {
    const k = (seen[p.cue] = (seen[p.cue] ?? -1) + 1);
    return { ...p, i: at(p.cue) + k * 1.2 };
  });
  return { lines, pieces, total: n };
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
  const { lines, pieces, total } = useMemo(build, []);

  const write = (v) => {
    const root = rootRef.current;
    if (!root) return;
    const t = instant ? 1 : within(v, span[0], span[1]);
    const e = instant ? 1 : within(v, arrive[0], arrive[1]);
    root.style.setProperty('--e', (1 - e).toFixed(4));
    // How many words are written (with a soft edge of three words).
    root.style.setProperty('--w', (t * (total + 4)).toFixed(3));
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
              {line.words.map((x, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  <span className={styles.word} style={{ '--i': x.i }}>
                    {x.w}
                  </span>
                </Fragment>
              ))}
            </Tag>
          );
        })}
      </div>

      <div className={styles.collage}>
        {pieces.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.piece}
            style={{ '--i': p.i, '--r': `${p.r}deg`, left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, aspectRatio: p.ratio, zIndex: p.z }}
            onClick={onSeeWork}
            aria-label={`${p.alt}. Open the Portfolio`}
          >
            <img src={`/assets/me/collage/${p.id}.webp`} alt="" draggable={false} loading="lazy" />
          </button>
        ))}
      </div>
    </section>
  );
}
