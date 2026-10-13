import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ShutdownPrompt.module.css';

const SWIPES_TO_SHUT_DOWN = 2;
/** A trackpad flick fires dozens of wheel events; a pause this long ends one swipe. */
const GESTURE_GAP_MS = 260;
const IDLE_RESET_MS = 2600;

const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

/** True if something under the pointer can still scroll up, that scroll is the user's, not ours. */
function scrollableAbove(target) {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.scrollTop > 0) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return true;
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Scrolling up on the desktop (past anything scrollable) asks to shut down.
 * Each separate swipe fills a fifth of the ring; the fifth shuts down. Any
 * downward scroll or a few idle seconds drains it, a stray flick never
 * surprises anyone.
 */
export default function ShutdownPrompt({ onShutDown, disabled = false }) {
  const [count, setCount] = useState(0);
  const lastEventRef = useRef(0);
  const countRef = useRef(0);
  const idleRef = useRef(0);

  useEffect(() => {
    if (disabled) return undefined;
    const set = (n) => {
      countRef.current = n;
      setCount(n);
    };
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (e.deltaY > 0) {
        if (countRef.current) set(0);
        return;
      }
      if (e.deltaY === 0 || scrollableAbove(e.target)) return;

      const now = performance.now();
      const newSwipe = now - lastEventRef.current > GESTURE_GAP_MS;
      lastEventRef.current = now;
      window.clearTimeout(idleRef.current);
      idleRef.current = window.setTimeout(() => set(0), IDLE_RESET_MS);
      if (!newSwipe) return;

      const next = countRef.current + 1;
      set(next);
      if (next >= SWIPES_TO_SHUT_DOWN) {
        window.clearTimeout(idleRef.current);
        onShutDown?.();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape' && countRef.current) set(0);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(idleRef.current);
    };
  }, [disabled, onShutDown]);

  const visible = !disabled && count > 0 && count < SWIPES_TO_SHUT_DOWN;
  const left = SWIPES_TO_SHUT_DOWN - count;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.scrim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          role="status"
        >
          {/* macOS-style HUD: big, centred, impossible to miss. */}
          <motion.button
            type="button"
            className={styles.hud}
            onClick={() => onShutDown?.()}
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.9 }}
          >
            <span className={styles.ring} aria-hidden>
              <svg viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={RING_R} className={styles.track} />
                <circle
                  cx="36"
                  cy="36"
                  r={RING_R}
                  className={styles.fill}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - count / SWIPES_TO_SHUT_DOWN)}
                />
                <path className={styles.power} d="M36 22v13M27.5 27a12.5 12.5 0 1 0 17 0" />
              </svg>
            </span>
            <span className={styles.title}>Shut Down</span>
            <span className={styles.sub}>
              Scroll up {left === 1 ? 'once more' : `${left} more times`} to close the Mac
            </span>
            <span className={styles.hint}>or click here. Scroll down to cancel.</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
