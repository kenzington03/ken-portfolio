// Phones get a phone. Where desktop visitors see the MacBook open, phone
// visitors see an iPhone (iOS 26, built from the Figma kit).
//
// The chrome ball has become the Apple logo; the phone slides up from below,
// BACK first: the logo lands on the back of it, where it belongs. Then the
// phone turns over (a real 3D half-turn) to show its screen, which wakes as the
// lock screen, and the live phone (App.jsx) takes over in exactly the same
// place, so you are inside it.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import IOS26Phone from '../../IOS26/IOS26Phone.jsx';
import { APPLE_BOX, APPLE_PATH } from '../../IOS26/applePath.js';
import { deviceFit, INSET_X, INSET_Y, SCREEN_H, SCREEN_W, ROOM } from '../../IOS26/geometry.js';
import { useTheme } from '../../IOS26/theme.js';
import styles from './PhoneEnding.module.css';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const within = (v, [a, b]) => clamp01((v - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const outCubic = (t) => 1 - (1 - t) ** 3;

const RISE = [0.02, 0.3]; // slides up into place, back to us
const TURN = [0.44, 0.72]; // the half-turn
const WAKE = [0.64, 0.76]; // the screen lights
const HANDOFF = 0.8; // the live phone takes over
// Where the journey rests: the phone is up, its back to us, the logo on it.
export const PHONE_STOPS = [0.4];
export const LOGO_VH = 0.12; // the Apple logo's height, a share of the viewport
const LOGO_AT = 0.42; // and where it sits on the back, a share of the phone's height

/** Where the journey's Apple logo rests: the middle of the phone's back. */
export function phoneLogoPoint() {
  const g = deviceFit();
  return { x: g.vw / 2, y: g.top + g.h * LOGO_AT };
}

/* The back of an iPhone 17 Pro: brushed titanium, the wide camera plateau
   across the top (three lenses, flash), the logo in frosted glass. Drawn in the
   bezel art's own 450 x 920 units, so it fits the phone at any size. */
function Back({ k, vh, opacity }) {
  const logoH = vh * LOGO_VH;
  return (
    <motion.div className={styles.back} style={{ '--k': k, opacity }}>
      <svg viewBox="0 0 450 920" width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="ti" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9eaec" />
            <stop offset="0.32" stopColor="#c4c6ca" />
            <stop offset="0.62" stopColor="#dcdee1" />
            <stop offset="1" stopColor="#b3b5ba" />
          </linearGradient>
          <linearGradient id="plateau" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2f3f4" />
            <stop offset="1" stopColor="#cfd1d5" />
          </linearGradient>
          <radialGradient id="lens" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#3a4150" />
            <stop offset="0.45" stopColor="#12141a" />
            <stop offset="1" stopColor="#05060a" />
          </radialGradient>
        </defs>
        {/* the body */}
        <rect x="9" y="9" width="432" height="902" rx="68" fill="url(#ti)" />
        <rect x="9.5" y="9.5" width="431" height="901" rx="67.5" fill="none" stroke="#fff" strokeOpacity="0.55" />
        {/* the camera plateau: wide, across the top */}
        <path d="M9 77a68 68 0 0 1 68-68h296a68 68 0 0 1 68 68v118a32 32 0 0 1-32 32H41a32 32 0 0 1-32-32z" fill="url(#plateau)" />
        <path d="M9 77a68 68 0 0 1 68-68h296a68 68 0 0 1 68 68v118a32 32 0 0 1-32 32H41a32 32 0 0 1-32-32z" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
        {/* three lenses */}
        {[
          [96, 74],
          [96, 158],
          [180, 116],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="37" fill="#a9acb2" />
            <circle cx={cx} cy={cy} r="33" fill="#1b1d23" />
            <circle cx={cx} cy={cy} r="26" fill="url(#lens)" />
            <circle cx={cx - 8} cy={cy - 9} r="6" fill="#fff" fillOpacity="0.16" />
          </g>
        ))}
        {/* flash, lidar, microphone */}
        <circle cx="300" cy="70" r="14" fill="#f6efd6" stroke="#b9b9bd" strokeWidth="3" />
        <circle cx="300" cy="148" r="13" fill="#0e1015" stroke="#a9acb2" strokeWidth="3" />
        <circle cx="362" cy="74" r="5" fill="#2a2c33" />
      </svg>
      {/* the logo, frosted into the glass back */}
      <svg className={styles.backLogo} viewBox={`${APPLE_BOX.x} ${APPLE_BOX.y} ${APPLE_BOX.w} ${APPLE_BOX.h}`} style={{ height: logoH, top: `${LOGO_AT * 100}%` }} aria-hidden>
        <path d={APPLE_PATH} fill="#8d9097" fillOpacity="0.55" />
      </svg>
    </motion.div>
  );
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

  // Up from below the fold with its back to us; then it turns over. A touch of
  // lift as it turns, so it reads as an object, not a flat card flipping.
  const angle = useTransform(q, (v) => 180 * (1 - inOut(within(v, TURN))));
  // Which face shows is decided by the angle, not by backface-visibility (Safari
  // did not hide the back): the back until it is edge-on, then the screen.
  const frontOp = useTransform(angle, (a) => (a <= 90 ? 1 : 0));
  const backOp = useTransform(angle, (a) => (a > 90 ? 1 : 0));
  const transform = useTransform(q, (v) => {
    const rise = outCubic(within(v, RISE));
    const turn = inOut(within(v, TURN));
    const y = (1 - rise) * g.vh * 0.6;
    if (turn >= 1) return `translate3d(0, ${y.toFixed(1)}px, 0)`; // flat again: no 3D (Safari drops the glass in 3D)
    const angle = 180 * (1 - turn);
    const lift = Math.sin(Math.PI * turn) * 0.05;
    return `perspective(1700px) translate3d(0, ${y.toFixed(1)}px, 0) rotateY(${angle.toFixed(2)}deg) scale(${(1 + lift).toFixed(4)})`;
  });
  const deviceIn = useTransform(q, (v) => within(v, [0, 0.08]));
  // The screen stays dark until the turn is nearly done, then lights.
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
          <motion.div className={styles.front} style={{ opacity: frontOp }}>
            {/* A still copy of the real lock screen, at the phone's size. */}
            <IOS26Phone theme={theme} framed inert scaleOverride={g.k} screen="lock" />
            <motion.div className={styles.boot} style={{ opacity: bootOpacity, left: INSET_X * g.k, top: INSET_Y * g.k, width: SCREEN_W * g.k, height: SCREEN_H * g.k }} />
          </motion.div>
          <Back k={g.k} vh={g.vh} opacity={backOp} />
        </motion.div>
      </div>
    </section>
  );
}
