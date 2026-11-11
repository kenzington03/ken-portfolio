// Q2: who Ken is, then what he does. First the way he works, in his own
// words, big: he questions every design he sees. Under it, what he plays
// and why. Then the four things he specialises in, each in a line. It all
// writes itself in with the scroll (so it plays back when scrolling up),
// each word rising into place out of a blur, then the three in turn. Under
// a fine pointer the letters thicken and lift as it passes over them.

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import styles from './MePanel.module.css';

// The statement, a line per array, broken where it reads aloud.
export const STATEMENT = [['Nothing', 'in', 'good', 'design'], ['is', 'there', 'by', 'accident.']];
// Under it, the question he asks of every design.
export const ASIDE = "Hi, I'm Ken. I make brands easy on the eyes, and hard to forget.";
// What he specialises in: each in a line, what it covers.
export const PILLARS = [
  { name: 'Brands', line: 'Identities, logos and guidelines that hold up wherever the brand goes.' },
  { name: 'Social', line: 'Posts, reels, ads and launch campaigns that keep a brand showing up.' },
  { name: 'Videos', line: 'Shoots, edits and motion graphics, from the idea to the final cut.' },
  { name: 'Products', line: 'Websites and app interfaces that people find easy to use.' },
];

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

// The statement's words in order (each pops up a hair after the last).
const build = () => {
  let n = 0;
  const lines = STATEMENT.map((line) => line.map((w) => ({ w, i: n++ })));
  return { lines, pillars: PILLARS };
};

/** A word set in letters (each letter's weight follows the pointer). */
function Letters({ text }) {
  return [...text].map((c, j) => (
    <span key={j} className={styles.l} data-l="">
      {c}
    </span>
  ));
}


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

/** The beat About is on (0..6), told by the ball (JourneyC's Cast) as it
 *  bounces on Videos' line: 1 the statement and that line, 2 the line
 *  under it, 3 to 6 the four. */
export const ABOUT_BEAT = 'ken:about-beat';
const PILLAR_BEAT = (k) => 3 + k;

/**
 * About: everything waits for the ball. `instant` shows it all at once.
 */
export default function MePanel({ instant, wide }) {
  const rootRef = useRef(null);
  const storyRef = useRef(null);
  const { lines, pillars } = useMemo(build, []);
  const [beat, setBeat] = useState(instant ? 6 : 0);
  useLetterWeight(storyRef);
  useEffect(() => {
    if (instant) {
      setBeat(6);
      return undefined;
    }
    const on = (e) => setBeat(e.detail);
    window.addEventListener(ABOUT_BEAT, on);
    return () => window.removeEventListener(ABOUT_BEAT, on);
  }, [instant]);

  return (
    <section ref={rootRef} className={`${styles.me} ${wide ? styles.wide : ''}`} data-beat={beat} aria-label="About Ken">
      <div ref={storyRef} className={styles.story}>
        {/* Read once: the label for screen readers, the letters for the eye
            (and for anything reading the page's text). */}
        <h2 className={`${styles.statement} ${beat >= 1 ? styles.in : ''}`} aria-label={STATEMENT.map((l) => l.join(' ')).join(' ')}>
          {lines.map((line, li) => (
            <span key={li} className={styles.line}>
              {line.map((x, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  <span className={styles.word} style={{ '--i': x.i }} aria-hidden>
                    <Letters text={x.w} />
                  </span>
                </Fragment>
              ))}
            </span>
          ))}
        </h2>
        <p className={`${styles.aside} ${beat >= 2 ? styles.in : ''}`}>
          {ASIDE}
        </p>
      </div>

      {/* What he specialises in. */}
      <ol className={styles.pillars} aria-label="What I specialise in">
        {pillars.map((p, k) => (
          <li key={p.name} className={styles.pillar}>
            {/* Its line: Videos' is there from the first bounce (the ball
                lands on it); the others come with their words. */}
            <span
              className={`${styles.rule} ${beat >= (p.name === 'Videos' ? 1 : PILLAR_BEAT(k)) ? styles.in : ''}`}
              data-ball-spot={p.name === 'Videos' ? '' : undefined}
            />
            <span className={`${styles.pillarBody} ${beat >= PILLAR_BEAT(k) ? styles.in : ''}`}>
              <span className={styles.pillarNum}>{String(k + 1).padStart(2, '0')}</span>
              <span className={styles.pillarName}>{p.name}</span>
              <span className={styles.pillarLine}>{p.line}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
