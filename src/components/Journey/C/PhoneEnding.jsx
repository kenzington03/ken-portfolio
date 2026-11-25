// Phones get a phone. Where desktop visitors see the MacBook open, phone
// visitors see an iPhone (iOS 26, built from the Figma kit): it spans the
// width of their screen with its lower half running off the bottom, Brand /
// Campaigns / Motion play above it, then it rises and grows until its screen
// is the visitor's screen. That screen is the real lock screen, so the hand-off
// to the full-screen phone (App.jsx) is the same picture: you are inside it.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { CHAPTERS } from '../../Intro3/timeline.js';
import { CHAPTER_CAPTIONS } from '../content.js';
import IOS26Phone from '../../IOS26/IOS26Phone.jsx';
import { useTheme } from '../../IOS26/theme.js';
import styles from './PhoneEnding.module.css';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, [a, b]) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Each word's share of the scroll, then the zoom into the screen.
const WINDOWS = [
  [0.04, 0.28],
  [0.28, 0.52],
  [0.52, 0.76],
];
const ZOOM = [0.78, 1];
// Where the journey rests on each word, its caption in (one scroll each).
export const PHONE_STOPS = WINDOWS.map(([a]) => a + 0.15);

// The iPhone 17 Pro bezel art is 450 x 920; the display (402 x 874) sits 24 px
// in from the sides and 23 px down. Everything scales from the body width.
const BODY_W = 450;
const BODY_H = 920;
const INSET_X = 24;
const INSET_Y = 23;
const SCREEN_W = 402;
const SCREEN_H = 874;
const TOP = 0.36; // the body's top edge, as a share of the viewport height

/** The iPhone's geometry for the current viewport (CSS px). */
export function phoneGeometry() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(vw - 32, 440);
  const k = w / BODY_W;
  return {
    vw,
    vh,
    w,
    k,
    h: BODY_H * k,
    left: (vw - w) / 2,
    top: Math.round(vh * TOP),
    bezel: INSET_Y * k,
    screenW: SCREEN_W * k,
    screenH: SCREEN_H * k,
  };
}

/** Where the journey's Apple logo should come to rest: where the lock-screen clock is. */
export function phoneLogoPoint() {
  const g = phoneGeometry();
  return { x: g.vw / 2, y: g.top + g.bezel + 158 * g.k };
}

function Chapter({ q, index }) {
  const [a, b] = WINDOWS[index];
  const tin = useTransform(q, (v) => inOut(within(v, [a, a + 0.07])));
  const tout = useTransform(q, (v) => inOut(within(v, [b - 0.06, b + 0.01])));
  const opacity = useTransform([tin, tout], ([i, o]) => Math.min(1, i * 2.5) * (1 - o));
  // Rotating slide: tips up from behind the phone, tips away over the top.
  const transform = useTransform([tin, tout], ([i, o]) => `translate3d(0, ${((1 - i) * 120 - o * 50).toFixed(1)}%, 0) rotateX(${((1 - i) * -78 + o * 72).toFixed(1)}deg)`);
  // The caption arrives a scroll after its word, word by word.
  const reveal = useTransform(q, (v) => within(v, [a + 0.075, a + 0.14]));
  const ch = CHAPTERS[index];
  const words = CHAPTER_CAPTIONS[ch.id].split(' ');
  return (
    <motion.div className={styles.chapter} style={{ opacity, transform }}>
      <span className={styles.word} style={{ color: ch.color }}>
        {ch.word}
      </span>
      <motion.span className={styles.caption} style={{ '--p': reveal, '--n': words.length, '--c': ch.color }}>
        {words.map((w, j) => (
          <span key={j} className={styles.captionWord} style={{ '--i': j }}>
            {w}{' '}
          </span>
        ))}
      </motion.span>
    </motion.div>
  );
}

export default function PhoneEnding({ onReach, innerRef, progressOut }) {
  const ref = useRef(null);
  const done = useRef(false);
  const [theme] = useTheme();
  const [g, setG] = useState(phoneGeometry);
  const { scrollYProgress: q } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  useLayoutEffect(() => {
    const on = () => setG(phoneGeometry());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const zoom = useTransform(q, (v) => inOut(within(v, ZOOM)));
  // Rise and grow until the screen (not the bezel) covers the viewport, its
  // top edge on the viewport's top edge.
  const transform = useTransform([zoom, q], ([z, v]) => {
    const s = Math.max(g.vw / g.screenW, g.vh / g.screenH);
    const scale = 1 + (s - 1) * z;
    const ty = (-g.top - s * g.bezel) * z;
    const rise = (1 - inOut(within(v, [0, 0.06]))) * 40; // settles in as it appears
    return `translate3d(0, ${(ty + rise).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  });
  const deviceIn = useTransform(q, (v) => within(v, [0, 0.05]));
  const glow = useTransform(q, (v) => {
    let i = 0;
    WINDOWS.forEach(([a], n) => {
      if (v >= a) i = n;
    });
    return CHAPTERS[i].color;
  });

  // The screen is dark (the phone is off, the Apple logo on it) until the zoom
  // begins; then it lights up as the lock screen.
  const bootOpacity = useTransform(q, (v) => 1 - within(v, [0.74, 0.8]));

  useMotionValueEvent(q, 'change', (v) => {
    progressOut?.set(v);
    if (v >= 0.985 && !done.current) {
      done.current = true;
      onReach?.();
    }
    if (v < 0.9) done.current = false;
  });

  useEffect(() => {
    if (innerRef) innerRef.current = ref.current;
  }, [innerRef]);

  const vars = { '--w': `${g.w}px`, '--h': `${g.h}px`, '--left': `${g.left}px`, '--top': `${g.top}px`, '--k': g.k };

  return (
    <section ref={ref} className={styles.runway} style={vars} aria-label="Open the iPhone">
      <div className={styles.stage}>
        <motion.div className={styles.glow} style={{ '--c': glow, opacity: deviceIn }} aria-hidden />
        <div className={styles.words}>
          {CHAPTERS.map((ch, i) => (
            <Chapter key={ch.id} q={q} index={i} />
          ))}
        </div>
        <motion.div className={styles.device} style={{ transform, opacity: deviceIn }} aria-hidden>
          {/* A still copy of the real lock screen, at the phone's size. */}
          <IOS26Phone theme={theme} framed inert scaleOverride={g.k} screen="lock" />
          <motion.div className={styles.boot} style={{ opacity: bootOpacity }} />
        </motion.div>
      </div>
    </section>
  );
}
