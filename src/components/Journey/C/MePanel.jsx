// Q2: who Ken is, in one line. The statement inks itself in with the scroll
// (so it plays back when scrolling up), set in four lines that each land a
// beat, the claims in the poster's ink. Beside it, his work as a loose pile
// of polaroids, each dropping in as the words reach it; any can be picked up
// and moved, and a tap opens the Portfolio.

import { Fragment, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import styles from './MePanel.module.css';

// The statement, a line per array; `*` marks a word in the ink.
const STATEMENT = [['Ten', 'years', 'building'], ['*brands', 'and', '*campaigns'], ['that', 'make', 'people'], ['*stop', 'and', '*look.']];

// The longer story, told on the phone page. A string is plain words;
// { hl } is a highlighted claim.
export const STORY = [
  { kind: 'hello', parts: ["Hey, I'm Ken."] },
  { kind: 'line', parts: ["For ten years I've built", { hl: 'brands' }, 'for', { hl: 'B2B tech, pharma, crypto and finance.' }] },
  { kind: 'line', parts: ['I start with the idea and the strategy, then design', { hl: 'campaigns' }, 'built to make', { hl: 'a real impact.' }] },
  { kind: 'line', parts: ["I can't look at a design without asking how it could be", { hl: 'better.' }] },
  { kind: 'big', parts: ['Design. Basketball. Chess.'] },
  { kind: 'aside', parts: ['Same obsession: the next good move.'] },
];

// The polaroids: where each lies in the pile (left, top, width as % of the
// pile; r its turn; z its layer), its caption, and the word it lands with.
// (The phone page shows the same pieces, in its own strip.)
export const COLLAGE = [
  { id: 'fluid-ai', alt: 'Fluid AI brand identity', caption: 'Fluid AI', cue: 'brands', x: 0, y: 6, w: 40, r: -8, z: 2, tape: true },
  { id: 'qmart', alt: 'Qmart campaign banner', caption: 'Qmart', cue: 'campaigns', x: 34, y: 0, w: 33, r: 5, z: 3 },
  { id: 'lebron', alt: 'A redesign concept around LeBron James', caption: 'LeBron, concept', cue: 'people', x: 63, y: 9, w: 35, r: 11, z: 2, tape: true },
  { id: 'truearte', alt: 'Truearte packaging', caption: 'Truearte', cue: 'stop', x: 5, y: 50, w: 31, r: 6, z: 4 },
  { id: 'beatles', alt: 'The Beatles, event artwork', caption: 'The Beatles', cue: 'and', x: 29, y: 37, w: 41, r: -3, z: 5, tape: true },
  { id: 'acdc', alt: 'AC/DC, event artwork', caption: 'AC/DC', cue: 'look.', x: 66, y: 49, w: 33, r: -10, z: 4 },
];

// Every word in order (each gets its turn as the scroll writes), and the
// turn each polaroid lands on (the last of its cue word, so 'and' is the
// one in the last line).
const build = () => {
  let n = 0;
  const lines = STATEMENT.map((line) =>
    line.map((raw) => {
      const ink = raw.startsWith('*');
      return { w: ink ? raw.slice(1) : raw, ink, i: n++ };
    }),
  );
  const all = lines.flat();
  const at = (word) => all.findLast((x) => x.w === word)?.i ?? 0;
  const pieces = COLLAGE.map((p) => ({ ...p, i: at(p.cue) + 0.4 }));
  return { lines, pieces, total: n };
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));

/** A polaroid: lands with its word, can be picked up, a tap opens the work. */
function Piece({ p, onSeeWork }) {
  const moved = useRef(false);
  return (
    <div className={styles.slot} style={{ '--i': p.i, '--r': `${p.r}deg`, left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: p.z }}>
      <motion.button
        type="button"
        className={styles.polaroid}
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.04, rotate: -2 }}
        whileDrag={{ scale: 1.08, rotate: 0, zIndex: 20 }}
        onDragStart={() => {
          moved.current = true;
        }}
        onPointerDown={() => {
          moved.current = false;
        }}
        onClick={() => {
          if (!moved.current) onSeeWork?.();
        }}
        aria-label={`${p.alt}. Open the Portfolio`}
      >
        {p.tape && <span className={styles.tape} aria-hidden />}
        <span className={styles.photo}>
          <img src={`/assets/me/collage/${p.id}.webp`} alt="" draggable={false} loading="lazy" />
        </span>
        <span className={styles.caption}>{p.caption}</span>
      </motion.button>
    </div>
  );
}

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
    // How many words are written (with a soft edge of two words).
    root.style.setProperty('--w', (t * (total + 2)).toFixed(3));
  };
  useMotionValueEvent(progress, 'change', write);
  useEffect(() => write(progress.get()));

  return (
    <section ref={rootRef} className={`${styles.me} ${wide ? styles.wide : ''}`} aria-label="About Ken">
      <div className={styles.story}>
        <p className={styles.eyebrow}>About</p>
        <h2 className={styles.statement}>
          {lines.map((line, li) => (
            <span key={li} className={styles.line}>
              {line.map((x, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  <span className={`${styles.word} ${x.ink ? styles.ink : ''}`} style={{ '--i': x.i }}>
                    {x.w}
                  </span>
                </Fragment>
              ))}
            </span>
          ))}
        </h2>
      </div>

      <div className={styles.pile}>
        {pieces.map((p) => (
          <Piece key={p.id} p={p} onSeeWork={onSeeWork} />
        ))}
        <span className={styles.hint} aria-hidden>
          Pick one up
        </span>
      </div>
    </section>
  );
}
