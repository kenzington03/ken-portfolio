// Phones get a phone. Where desktop visitors see the MacBook open, phone
// visitors see an iPhone (iOS 26, built from the Figma kit). It slides up into
// the middle of the screen, whole: bezel, Dynamic Island, side buttons, so it
// is plain that this is a phone inside the visitor's phone. It rests dark with
// the chrome Apple logo on its screen, then wakes up as the lock screen, and
// the live phone (App.jsx) takes over in exactly the same place.
// No zoom, no words: the line before it ("Open the iPhone to see the work.")
// already said it.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import IOS26Phone from '../../IOS26/IOS26Phone.jsx';
import { deviceFit, INSET_X, INSET_Y, SCREEN_H, SCREEN_W, ROOM } from '../../IOS26/geometry.js';
import { useTheme } from '../../IOS26/theme.js';
import styles from './PhoneEnding.module.css';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, [a, b]) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const outCubic = (t) => 1 - (1 - t) ** 3;

const RISE = [0.02, 0.34]; // slides up into place
const WAKE = [0.5, 0.64]; // the screen lights
const HANDOFF = 0.72; // the live phone takes over
// Where the journey rests: the phone is up, dark, the logo on its screen.
export const PHONE_STOPS = [0.4];

/** Where the journey's Apple logo rests: the middle of the phone's screen. */
export function phoneLogoPoint() {
  const g = deviceFit();
  return { x: g.vw / 2, y: g.top + (INSET_Y + SCREEN_H * 0.42) * g.k };
}

export default function PhoneEnding({ onReach, innerRef, progressOut }) {
  const ref = useRef(null);
  const done = useRef(false);
  const [theme] = useTheme();
  const [g, setG] = useState(() => deviceFit());
  const { scrollYProgress: q } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  useLayoutEffect(() => {
    const on = () => setG(deviceFit());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // Up from below the fold, settling a touch larger and then to size.
  const transform = useTransform(q, (v) => {
    const t = outCubic(within(v, RISE));
    return `translate3d(0, ${((1 - t) * g.vh * 0.55).toFixed(1)}px, 0) scale(${(1 + (1 - t) * 0.1).toFixed(4)})`;
  });
  const deviceIn = useTransform(q, (v) => within(v, [0, 0.1]));
  // The screen is dark until the wake, then it is the lock screen.
  const bootOpacity = useTransform(q, (v) => 1 - inOut(within(v, WAKE)));

  useMotionValueEvent(q, 'change', (v) => {
    progressOut?.set(v);
    if (v >= HANDOFF && !done.current) {
      done.current = true;
      onReach?.();
    }
    if (v < HANDOFF - 0.1) done.current = false;
  });

  useEffect(() => {
    if (innerRef) innerRef.current = ref.current;
  }, [innerRef]);

  const vars = { '--w': `${g.w}px`, '--h': `${g.h}px`, '--left': `${g.left}px`, '--top': `${g.top}px`, '--k': g.k, '--room': ROOM };

  return (
    <section ref={ref} className={styles.runway} style={vars} aria-label="Open the iPhone">
      <div className={styles.stage}>
        <motion.div className={styles.device} style={{ transform, opacity: deviceIn }} aria-hidden>
          <div className={styles.shadow} />
          {/* A still copy of the real lock screen, at the phone's size. */}
          <IOS26Phone theme={theme} framed inert scaleOverride={g.k} screen="lock" />
          <motion.div className={styles.boot} style={{ opacity: bootOpacity, left: INSET_X * g.k, top: INSET_Y * g.k, width: SCREEN_W * g.k, height: SCREEN_H * g.k }} />
        </motion.div>
      </div>
    </section>
  );
}
