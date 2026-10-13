import { useCallback, useEffect, useRef, useState } from 'react';
import {
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

const LIFT_AT = 380; // the frame that matches the 3D screen holds this long
const DONE_AT = 1350; // letters gone, backdrop dissolved: desktop takes over

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
  const [phase, setPhase] = useState('hold'); // hold → lift
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
    const t1 = setTimeout(() => setPhase('lift'), reduced ? 500 : LIFT_AT);
    const t2 = setTimeout(finish, reduced ? 900 : DONE_AT);
    return () => {
      cancelled = true;
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
