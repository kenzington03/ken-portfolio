import { useEffect, useRef } from 'react';
import styles from './HelloMac.module.css';

// The Mac's "hello", as it greets you on a new Mac: written in one stroke,
// then it clears for the desktop. The stroke is the "hello" from LottieFiles'
// free "Hello Apple" animation (its path and timing, drawn here as an SVG
// line rather than through a Lottie player).
const HELLO = 'M-145.7 43.7C-145.7 43.7 -86.1 10.3 -81.9 -26.2C-79.4 -46.9 -98.6 -44.1 -101.4 -23.0C-103.8 -5.8 -109.6 40.6 -109.6 40.6C-109.6 40.6 -104.0 -0.0 -85.9 1.8C-65.9 4.1 -92.0 40.0 -69.0 40.3C-48.6 40.5 -27.6 22.7 -26.9 10.9C-26.0 -2.6 -44.4 -4.9 -50.0 12.0C-55.2 27.5 -43.6 44.9 -23.5 40.6C7.3 33.9 22.5 -10.8 23.9 -26.1C25.5 -42.2 13.7 -43.7 6.6 -29.4C-0.1 -16.0 -11.2 37.1 13.0 41.6C41.8 46.9 64.3 -5.9 67.1 -23.8C69.8 -41.1 58.7 -46.0 50.2 -30.7C41.2 -14.2 27.8 44.1 59.9 41.3C86.7 39.0 76.9 2.3 102.9 -0.1C114.6 -1.1 119.4 9.9 118.5 21.0C117.6 32.6 106.7 42.5 95.8 40.9C85.9 39.5 80.8 26.0 83.4 17.1C86.6 6.1 96.7 0.1 102.9 -0.1C111.8 -0.3 116.2 5.3 124.1 5.2C131.2 5.1 138.3 -2.9 138.3 -2.9';
const DRAW_MS = 2300;
const HOLD_MS = 700;
const OUT_MS = 700;

export default function HelloMac({ onDone }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => done.current(), reduced ? 1200 : DRAW_MS + HOLD_MS + OUT_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={styles.hello} style={{ '--draw': `${DRAW_MS}ms`, '--out': `${OUT_MS}ms`, '--outAt': `${DRAW_MS + HOLD_MS}ms` }} onClick={onDone} role="presentation">
      <svg viewBox="-160 -60 320 120" aria-label="hello">
        <path pathLength="1" d={HELLO} />
      </svg>
    </div>
  );
}
