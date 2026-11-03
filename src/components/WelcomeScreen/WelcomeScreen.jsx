import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HELLO_PATH,
  HELLO_W,
  STAGE_H,
  STAGE_W,
  SUBTITLE_Y,
  TITLE_Y,
  WELCOME_SUBTITLE,
  WELCOME_TITLE,
  coverScale,
  loadScreenAssets,
  paintWelcome,
} from './screenArt.js';
import styles from './WelcomeScreen.module.css';

// From the dive: "hello" (as the 3D screen left it), then it clears and the
// title writes in, holds, and lifts away into the desktop.
const TITLE_AT = 600; // "hello" holds this long, then gives way to the title
const LIFT_AT = 2500; // the title has been read: lift
const DONE_AT = 3470; // letters gone, backdrop dissolved: desktop takes over

/**
 * The beat the intro dive lands on. At first it is pixel-for-pixel the 3D
 * screen (same canvas backdrop, same title position), then it moves: the
 * letters lift away in a wave, the wallpaper breathes forward and dissolves
 * into the desktop that is already mounted underneath. No static hold, no
 * load wait. Any click or key jumps straight to the desktop.
 */
export default function WelcomeScreen({ onDone }) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(() => coverScale(window.innerWidth, window.innerHeight));
  const [phase, setPhase] = useState('phaseHello'); // phaseHello → phaseTitle → lift
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    loadScreenAssets().then((assets) => {
      if (!cancelled && canvasRef.current) {
        paintWelcome(canvasRef.current, assets, Math.min(2, window.devicePixelRatio || 1) * 1.5, { text: false });
      }
    });
    const onResize = () => setScale(coverScale(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', finish);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = setTimeout(() => setPhase('phaseTitle'), reduced ? 300 : TITLE_AT);
    const t1 = setTimeout(() => setPhase('lift'), reduced ? 1400 : LIFT_AT);
    const t2 = setTimeout(finish, reduced ? 1800 : DONE_AT);
    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', finish);
    };
  }, [finish]);

  const stage = { width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` };

  return (
    <div className={`${styles.welcome} ${styles[phase]}`} onClick={finish} role="status" aria-label={WELCOME_TITLE}>
      <canvas ref={canvasRef} className={`${styles.stage} ${styles.backdrop}`} style={stage} />
      <div className={styles.stage} style={stage} aria-hidden>
        <svg
          className={styles.hello}
          viewBox="-160 -60 320 120"
          style={{ left: STAGE_W / 2 - HELLO_W / 2, top: STAGE_H / 2 - (HELLO_W * 120) / 320 / 2, width: HELLO_W }}
        >
          <path d={HELLO_PATH} />
        </svg>
        <p className={styles.title} style={{ top: TITLE_Y }}>
          {[...WELCOME_TITLE].map((ch, i) => (
            <span key={i} style={{ '--i': i }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </p>
        <p className={styles.subtitle} style={{ top: SUBTITLE_Y }}>
          {WELCOME_SUBTITLE}
        </p>
      </div>
    </div>
  );
}
