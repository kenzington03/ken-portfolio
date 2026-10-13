// Phones get a phone. Where desktop visitors see the MacBook open, phone
// visitors see an iPhone: Build / Move / Ship play above it, then the device
// grows until its screen is the visitor's screen and the iPhone home takes
// over (same wallpaper, so the cut is invisible). Pure DOM: no 3D on phones.

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { CHAPTERS } from '../../Intro3/timeline.js';
import { CHAPTER_CAPTIONS } from '../content.js';
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

/** Device width in px: must match the outline the timeline's ball grows into. */
export const phoneWidth = () => Math.min(window.innerWidth * 0.56, window.innerHeight * 0.29);
export const PHONE_RATIO = 19.5 / 9;
export const PHONE_CENTER = 0.6; // of the viewport height

function Chapter({ q, index }) {
  const [a, b] = WINDOWS[index];
  const tin = useTransform(q, (v) => inOut(within(v, [a, a + 0.07])));
  const tout = useTransform(q, (v) => inOut(within(v, [b - 0.06, b + 0.01])));
  const opacity = useTransform([tin, tout], ([i, o]) => Math.min(1, i * 2.5) * (1 - o));
  // Rotating slide: tips up from behind the phone, tips away over the top.
  const transform = useTransform([tin, tout], ([i, o]) => `translate3d(0, ${((1 - i) * 120 - o * 50).toFixed(1)}%, 0) rotateX(${((1 - i) * -78 + o * 72).toFixed(1)}deg)`);
  const ch = CHAPTERS[index];
  return (
    <motion.div className={styles.chapter} style={{ opacity, transform }}>
      <span className={styles.word} style={{ color: ch.color }}>
        {ch.word}
      </span>
      <span className={styles.caption}>{CHAPTER_CAPTIONS[ch.id]}</span>
    </motion.div>
  );
}

function clock() {
  const d = new Date();
  return {
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, ''),
    date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  };
}

export default function PhoneEnding({ onReach, innerRef }) {
  const ref = useRef(null);
  const done = useRef(false);
  const [now] = useState(clock);
  const { scrollYProgress: q } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const zoom = useTransform(q, (v) => inOut(within(v, ZOOM)));
  // Grow until the screen covers the viewport (plus a margin for the bezel).
  const scale = useTransform(zoom, (z) => {
    const w = phoneWidth();
    const fill = Math.max(window.innerWidth / w, window.innerHeight / (w * PHONE_RATIO)) * 1.12;
    return 1 + (fill - 1) * z;
  });
  const lock = useTransform(zoom, (z) => 1 - within(z, [0.25, 0.7])); // lock-screen clock fades as you go in
  const deviceIn = useTransform(q, (v) => within(v, [0, 0.05]));
  const glow = useTransform(q, (v) => {
    let i = 0;
    WINDOWS.forEach(([a], n) => {
      if (v >= a) i = n;
    });
    return CHAPTERS[i].color;
  });

  useMotionValueEvent(q, 'change', (v) => {
    if (v >= 0.985 && !done.current) {
      done.current = true;
      onReach?.();
    }
    if (v < 0.9) done.current = false;
  });

  useEffect(() => {
    if (innerRef) innerRef.current = ref.current;
  }, [innerRef]);

  return (
    <section ref={ref} className={styles.runway} aria-label="Open the iPhone">
      <div className={styles.stage}>
        <motion.div className={styles.glow} style={{ '--c': glow, opacity: deviceIn }} aria-hidden />
        <div className={styles.words}>
          {CHAPTERS.map((ch, i) => (
            <Chapter key={ch.id} q={q} index={i} />
          ))}
        </div>
        <motion.div className={styles.device} style={{ scale, opacity: deviceIn }} aria-hidden>
          <div className={styles.screen}>
            <span className={styles.island} />
            <motion.div className={styles.lock} style={{ opacity: lock }}>
              <span className={styles.date}>{now.date}</span>
              <span className={styles.time}>{now.time}</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
