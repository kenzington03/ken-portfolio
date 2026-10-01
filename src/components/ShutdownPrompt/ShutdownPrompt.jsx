import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ShutdownPrompt.module.css';

const SWIPES_TO_SHUT_DOWN = 5;
/** A trackpad flick fires dozens of wheel events; a pause this long ends one swipe. */
const GESTURE_GAP_MS = 260;
const IDLE_RESET_MS = 3000;

const RING_R = 10;
const RING_C = 2 * Math.PI * RING_R;

/** True if something under the pointer can still scroll up — that scroll is the user's, not ours. */
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
 * downward scroll or a few idle seconds drains it — a stray flick never
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
          className={styles.wrap}
          initial={{ opacity: 0, y: -14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }}
          role="status"
        >
          <button type="button" className={styles.pill} onClick={() => onShutDown?.()}>
            <span className={styles.ring} aria-hidden>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r={RING_R} className={styles.track} />
                <circle
                  cx="12"
                  cy="12"
                  r={RING_R}
                  className={styles.fill}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - count / SWIPES_TO_SHUT_DOWN)}
                />
                <path className={styles.power} d="M12 7.2v4.3M9.1 8.9a4.1 4.1 0 1 0 5.8 0" />
              </svg>
            </span>
            <span className={styles.text}>
              <span className={styles.title}>Shut down?</span>
              <span className={styles.sub}>
                Scroll up {left} more {left === 1 ? 'time' : 'times'}, or click
              </span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
