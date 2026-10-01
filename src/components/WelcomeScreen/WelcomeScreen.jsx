import { useCallback, useEffect, useRef, useState } from 'react';
import { STAGE_H, STAGE_W, WELCOME_TITLE, coverScale, loadScreenAssets, paintWelcome } from './screenArt.js';
import styles from './WelcomeScreen.module.css';

const HOLD_MS = 1300;
const EXIT_MS = 650;

/**
 * The beat the intro dive lands on: the MacBook's screen, now full-viewport,
 * says hello and dissolves into the desktop. Paints the same canvas art as
 * the 3D screen texture so the WebGL → DOM handoff is invisible. Any click
 * or key skips the hold.
 */
export default function WelcomeScreen({ onDone }) {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(() => coverScale(window.innerWidth, window.innerHeight));
  const [exiting, setExiting] = useState(false);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setExiting(true);
    setTimeout(() => onDone?.(), EXIT_MS);
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    loadScreenAssets().then((assets) => {
      if (!cancelled && canvasRef.current) {
        paintWelcome(canvasRef.current, assets, Math.min(2, window.devicePixelRatio || 1) * 1.5);
      }
    });
    const onResize = () => setScale(coverScale(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', finish);
    const t = setTimeout(finish, HOLD_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', finish);
    };
  }, [finish]);

  return (
    <div
      className={`${styles.welcome} ${exiting ? styles.exiting : ''}`}
      onClick={finish}
      role="status"
      aria-label={WELCOME_TITLE}
    >
      <canvas
        ref={canvasRef}
        className={styles.art}
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}
      />
    </div>
  );
}
