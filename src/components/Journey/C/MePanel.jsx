// Q2: who Ken is, in one sentence, set big in the middle of the page. It
// writes itself in with the scroll (so it plays back when scrolling up), each
// word rising into place out of a blur. Under a fine pointer the letters
// thicken and lift as it passes over them.

import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import styles from './MePanel.module.css';

// The statement, a line per array, broken where it reads aloud.
const STATEMENT = [['Ten', 'years', 'designing'], ['brands', 'and', 'campaigns'], ['for', 'products', 'that', 'are'], ['hard', 'to', 'explain.']];

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

// The work, shown on the phone page as polaroids in a strip (caption, turn r;
// x, y, w, z and tape place them).
export const COLLAGE = [
  { id: 'fluid-ai', alt: 'Fluid AI brand identity', caption: 'Fluid AI', cue: 'brands', x: 0, y: 6, w: 40, r: -8, z: 2, tape: true },
  { id: 'qmart', alt: 'Qmart campaign banner', caption: 'Qmart', cue: 'campaigns', x: 34, y: 0, w: 33, r: 5, z: 3 },
  { id: 'lebron', alt: 'A redesign concept around LeBron James', caption: 'LeBron, concept', cue: 'designing', x: 63, y: 9, w: 35, r: 11, z: 2, tape: true },
  { id: 'truearte', alt: 'Truearte packaging', caption: 'Truearte', cue: 'products', x: 5, y: 50, w: 31, r: 6, z: 4 },
  { id: 'beatles', alt: 'The Beatles, event artwork', caption: 'The Beatles', cue: 'hard', x: 29, y: 37, w: 41, r: -3, z: 5, tape: true },
  { id: 'acdc', alt: 'AC/DC, event artwork', caption: 'AC/DC', cue: 'explain.', x: 66, y: 49, w: 33, r: -10, z: 4 },
];

// Every word in order: each gets its turn as the scroll writes.
const build = () => {
  let n = 0;
  const lines = STATEMENT.map((line) => line.map((w) => ({ w, i: n++ })));
  return { lines, total: n };
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, a, b) => clamp01((v - a) / (b - a));

// The pointer over the statement: letters within REACH px of it swell from
// the line's weight to the face's heaviest and lift a touch, and ease back as
// it moves on.
const WEIGHT = { base: 720, max: 900 };
const LIFT = 0.07; // em, at the pointer
const REACH = 170;

function useLetterWeight(storyRef) {
  useEffect(() => {
    const story = storyRef.current;
    if (!story) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const letters = [...story.querySelectorAll('[data-l]')].map((el) => ({ el, x: 0, y: 0, w: WEIGHT.base }));
    let measured = false;
    // Where each letter sits in the statement (at the line's weight).
    const measure = () => {
      measured = story.offsetWidth > 0;
      letters.forEach((l) => {
        l.x = l.el.offsetLeft + l.el.offsetWidth / 2;
        l.y = l.el.offsetTop + l.el.offsetHeight / 2;
      });
    };
    const ptr = { x: -1e4, y: -1e4 };
    let raf = 0;
    const frame = () => {
      raf = 0;
      if (!measured) measure();
      const box = story.getBoundingClientRect();
      const px = ptr.x - box.left;
      const py = ptr.y - box.top;
      let moving = false;
      letters.forEach((l) => {
        const d = Math.hypot(px - l.x, (py - l.y) * 1.3);
        const k = Math.max(0, 1 - d / REACH);
        const target = WEIGHT.base + (WEIGHT.max - WEIGHT.base) * k * k;
        const next = l.w + (target - l.w) * 0.2;
        if (Math.abs(next - l.w) > 0.4) {
          moving = true;
          l.w = next;
          const f = (next - WEIGHT.base) / (WEIGHT.max - WEIGHT.base);
          l.el.style.fontVariationSettings = `'wght' ${next.toFixed(0)}, 'opsz' 72`;
          l.el.style.transform = f > 0.01 ? `translate3d(0, ${(-LIFT * f).toFixed(3)}em, 0)` : '';
        }
      });
      if (moving) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMove = (e) => {
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      kick();
    };
    const onLeave = () => {
      ptr.x = -1e4;
      ptr.y = -1e4;
      kick();
    };
    const onResize = () => {
      measured = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, [storyRef]);
}

/**
 * `progress` is the journey's scroll; `span` [a, b] is where the paragraph
 * writes itself; `arrive` [a, b] the whole crossing from the hero, for the
 * depth. `instant` shows it written.
 */
export default function MePanel({ progress, span, arrive, instant, wide }) {
  const rootRef = useRef(null);
  const storyRef = useRef(null);
  const { lines, total } = useMemo(build, []);
  useLetterWeight(storyRef);

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
      <div ref={storyRef} className={styles.story}>
        <h2 className={styles.statement}>
          <span className={styles.srOnly}>{STATEMENT.map((l) => l.join(' ')).join(' ')}</span>
          {lines.map((line, li) => (
            <span key={li} className={styles.line}>
              {line.map((x, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  <span className={styles.word} style={{ '--i': x.i }} aria-hidden>
                    {[...x.w].map((c, j) => (
                      <span key={j} className={styles.l} data-l="">
                        {c}
                      </span>
                    ))}
                  </span>
                </Fragment>
              ))}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
