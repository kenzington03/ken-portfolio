// Q2: who Ken is, loud. A slab of the poster's ink slides in beside him;
// on it his paragraph writes itself with the scroll (so it plays back when
// scrolling up), the claims that matter get a highlighter swipe as they are
// written, and it ends on the three things he is: design, basketball, chess.
// Under it, a collage of his work builds in step with the words (each piece
// lands with the words it proves) and can be picked up and moved around.

import { Fragment, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import styles from './MePanel.module.css';

// The paragraph. A string is plain words; { hl } is a highlighted claim.
export const STORY = [
  { kind: 'hello', parts: ["Hey, I'm Ken."] },
  { kind: 'line', parts: ["For ten years I've built", { hl: 'brands' }, 'for', { hl: 'B2B tech, pharma, crypto and finance.' }] },
  { kind: 'line', parts: ['I start with the idea and the strategy, then design', { hl: 'campaigns' }, 'built to make', { hl: 'a real impact.' }] },
  { kind: 'line', parts: ["I can't look at a design without asking how it could be", { hl: 'better.' }] },
  { kind: 'big', parts: ['Design. Basketball. Chess.'] },
  { kind: 'aside', parts: ['Same obsession: the next good move.'] },
];

// The collage: where each piece sits in its box (left, top, width as % of
// the box; r its turn; z its layer) and the word it lands with.
export const COLLAGE = [
  { id: 'fluid-ai', alt: 'Fluid AI brand identity', cue: 'brands', ratio: 1, x: 0, y: 6, w: 25, r: -6, z: 2 },
  { id: 'truearte', alt: 'Truearte packaging', cue: 'brands', ratio: 720 / 669, x: 19, y: 36, w: 26, r: 4, z: 3 },
  { id: 'qmart', alt: 'Qmart campaign banner', cue: 'campaigns', ratio: 720 / 431, x: 38, y: 0, w: 36, r: -3, z: 1 },
  { id: 'beatles', alt: 'The Beatles, event artwork', cue: 'campaigns', ratio: 720 / 622, x: 44, y: 40, w: 24, r: 3, z: 4 },
  { id: 'acdc', alt: 'AC/DC, event artwork', cue: 'campaigns', ratio: 720 / 623, x: 66, y: 34, w: 25, r: -4, z: 3 },
  { id: 'lebron', alt: 'A redesign concept around LeBron James', cue: 'better.', ratio: 720 / 450, x: 71, y: 2, w: 29, r: 6, z: 2 },
];

// Every word in order (each gets its turn as the scroll writes); the
// highlights' spans of turns; and the turn each collage piece lands on.
const build = () => {
  let n = 0;
  const lines = STORY.map((line) => ({
    ...line,
    parts: line.parts.map((p) => {
      const text = typeof p === 'string' ? p : p.hl;
      const words = text.split(' ').map((w) => ({ w, i: n++ }));
      return { hl: typeof p !== 'string', words, from: words[0].i, to: words[words.length - 1].i + 1 };
    }),
  }));
  const all = lines.flatMap((l) => l.parts.flatMap((p) => p.words));
  const at = (word) => all.find((x) => x.w === word)?.i ?? 0;
  const seen = {};
  const pieces = COLLAGE.map((p) => {
    const k = (seen[p.cue] = (seen[p.cue] ?? -1) + 1);
    return { ...p, i: at(p.cue) + k * 1.2 };
  });
  return { lines, pieces, total: n };
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));

/** A piece of work in the collage: lands with its words, can be dragged. */
function Piece({ p, onSeeWork }) {
  const moved = useRef(false);
  return (
    <div className={styles.slot} style={{ '--i': p.i, '--r': `${p.r}deg`, left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, zIndex: p.z }}>
      <motion.button
        type="button"
        className={styles.piece}
        style={{ aspectRatio: p.ratio }}
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.05, rotate: -1.5 }}
        whileDrag={{ scale: 1.1, rotate: 0, zIndex: 20 }}
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
        <img src={`/assets/me/collage/${p.id}.webp`} alt="" draggable={false} loading="lazy" />
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
    // How many words are written (with a soft edge of four words).
    root.style.setProperty('--w', (t * (total + 4)).toFixed(3));
  };
  useMotionValueEvent(progress, 'change', write);
  useEffect(() => write(progress.get()));

  return (
    <section ref={rootRef} className={`${styles.me} ${wide ? styles.wide : ''}`} aria-label="About Ken">
      <div className={styles.slab} aria-hidden />
      <div className={styles.story}>
        {lines.map((line, li) => {
          const Tag = line.kind === 'hello' ? 'h2' : 'p';
          return (
            <Tag key={li} className={styles[line.kind]}>
              {line.parts.map((part, pi) => (
                <Fragment key={pi}>
                  {pi > 0 && ' '}
                  <span className={part.hl ? styles.hl : undefined} style={part.hl ? { '--a': part.from, '--b': part.to } : undefined}>
                    {part.words.map((x, k) => (
                      <Fragment key={k}>
                        {k > 0 && ' '}
                        <span className={styles.word} style={{ '--i': x.i }}>
                          {x.w}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                </Fragment>
              ))}
            </Tag>
          );
        })}
      </div>

      <div className={styles.collage}>
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
