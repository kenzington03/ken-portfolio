// Hero B, "Photo Booth". Ken's reel beat (walk in, freeze, shutter) is
// exactly what Photo Booth does: he walks into the live view, the 3·2·1
// lights count down, the whole screen flashes white, and the frame drops
// into the filmstrip. The red button is real: after the first shot the
// visitor can take more (up to four, like a strip).

import { useCallback, useEffect, useRef, useState } from 'react';
import Figure, { Slot } from './Figure.jsx';
import styles from './hero.module.css';

const SETTLE_MS = 450; // he lands, a breath, then the countdown
const COUNT_MS = 640; // per number
const MAX_FRAMES = 4;

export default function HeroBooth({ go, reduced, instant, src, poster, onShutter, onDone }) {
  const [phase, setPhase] = useState(instant ? 'still' : 'wait');
  const [count, setCount] = useState(0); // 3, 2, 1 while counting; 0 otherwise
  const [frames, setFrames] = useState(instant ? [0] : []);
  const [flashKey, setFlashKey] = useState(0);
  const figRef = useRef(null);
  const timers = useRef([]);
  const busy = useRef(false);
  const shotOnce = useRef(!!instant);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (instant) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snap = useCallback(() => {
    setPhase('still');
    setCount(0);
    onShutter?.();
    if (!reduced) setFlashKey((k) => k + 1);
    later(() => {
      setFrames((f) => [...f, f.length ? f[f.length - 1] + 1 : 0].slice(-MAX_FRAMES));
      busy.current = false;
      if (!shotOnce.current) {
        shotOnce.current = true;
        onDone?.();
      }
    }, reduced ? 0 : 260);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onShutter, onDone, reduced]);

  const countdown = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    if (reduced) {
      snap();
      return;
    }
    setCount(3);
    later(() => setCount(2), COUNT_MS);
    later(() => setCount(1), COUNT_MS * 2);
    later(snap, COUNT_MS * 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, snap]);

  useEffect(() => {
    if (!go || shotOnce.current) return;
    if (reduced) {
      countdown();
      return;
    }
    setPhase('walk');
  }, [go, reduced, countdown]);

  const onArrive = () => {
    if (shotOnce.current) return;
    setPhase('idle');
    later(countdown, SETTLE_MS);
  };

  const ready = phase === 'idle' || phase === 'still';
  const label = shotOnce.current ? 'Take another photo' : 'Take the photo now';

  return (
    <div className={`${styles.stage} ${styles.boothStage}`}>
      <div className={styles.boothView} aria-hidden>
        <Figure ref={figRef} phase={phase} src={src} poster={poster} onArrive={onArrive} className={styles.boothFigure} />
      </div>

      <div className={styles.boothBar}>
        <div className={styles.boothCount} aria-hidden>
          {[3, 2, 1].map((n) => (
            <span key={n} className={count && n >= count ? styles.countOn : ''}>
              {n}
            </span>
          ))}
        </div>
        <button
          type="button"
          className={styles.boothBtn}
          onClick={countdown}
          disabled={!ready || count > 0}
          aria-label={label}
          title={label}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
            <path
              fill="currentColor"
              d="M9.4 4.5h5.2c.5 0 .9.3 1.1.7l.7 1.5h2.1A2.5 2.5 0 0 1 21 9.2v8.3a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5V9.2a2.5 2.5 0 0 1 2.5-2.5h2.1l.7-1.5c.2-.4.6-.7 1.1-.7ZM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
            />
          </svg>
        </button>
      </div>

      <ol className={styles.strip} aria-label={`${frames.length} photo${frames.length === 1 ? '' : 's'} taken`}>
        {Array.from({ length: MAX_FRAMES }, (_, i) => {
          const id = frames[i];
          return (
            <li key={id ?? `empty-${i}`} className={id === undefined ? styles.stripEmpty : styles.stripFrame}>
              {id !== undefined && <Slot />}
            </li>
          );
        })}
      </ol>

      {flashKey > 0 && <div key={flashKey} className={styles.boothFlash} aria-hidden />}
    </div>
  );
}
