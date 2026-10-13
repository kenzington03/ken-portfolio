// Ken, walking in. Until the real clip exists this is a neutral placeholder
// block that makes the same moves, so timing and sound can be judged now.
// Pass `src` (+ `poster`) and the video drives the same beats.
//
// phase: 'wait' (off-frame) → 'walk' → 'idle' (arrived, breathing) → 'still'.
// The parent owns the phase; `onArrive` fires when the walk is over.

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import styles from './hero.module.css';

export const WALK_MS = 1900;

const Figure = forwardRef(function Figure({ phase, src, poster, onArrive, className = '' }, ref) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const arrived = useRef(false);

  useImperativeHandle(ref, () => ({
    el: rootRef.current,
    /** Paint the current frame into a canvas (for screenshot thumbnails). */
    grab(canvas) {
      const v = videoRef.current;
      if (!v || !canvas || !v.videoWidth) return false;
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext('2d').drawImage(v, 0, 0);
      return true;
    },
  }));

  const arrive = () => {
    if (arrived.current) return;
    arrived.current = true;
    onArrive?.();
  };

  useEffect(() => {
    if (phase !== 'walk') return undefined;
    if (src) {
      videoRef.current?.play().catch(arrive);
      return undefined;
    }
    const t = setTimeout(arrive, WALK_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, src]);

  useEffect(() => {
    if (phase === 'still') videoRef.current?.pause();
  }, [phase]);

  return (
    <div ref={rootRef} className={`${styles.figure} ${styles[`figure_${phase}`]} ${src ? styles.figureClip : ''} ${className}`} aria-hidden>
      <div className={styles.figureBob}>
        {src ? (
          <video
            ref={videoRef}
            className={styles.figureVideo}
            src={src}
            poster={poster}
            muted
            playsInline
            preload="auto"
            onEnded={arrive}
          />
        ) : (
          <Slot />
        )}
      </div>
    </div>
  );
});

export function Slot() {
  return (
    <div className={styles.slot}>
      <span className={styles.slotHead} />
      <span className={styles.slotBody} />
      <span className={styles.slotLabel}>
        Video slot
        <small>Ken walks in</small>
      </span>
    </div>
  );
}

export default Figure;
