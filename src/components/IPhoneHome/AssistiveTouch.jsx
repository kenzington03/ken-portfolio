// iPhone's AssistiveTouch: the floating, semi-transparent button that is
// always on screen. Drag it to any edge (it settles against the nearest
// side, as on iOS); tap it for the menu: Home, Back, Contact, and a way out
// of the beta back to the page.

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, animate } from 'framer-motion';
import styles from './AssistiveTouch.module.css';

const SIZE = 56;
const EDGE = 8;

export default function AssistiveTouch({ onHome, onBack, onContact, onExit }) {
  const [open, setOpen] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragged = useRef(false);

  // After a drag, it slides to the nearer side, as the real one does.
  const settle = () => {
    const vw = window.innerWidth;
    const startLeft = vw - SIZE - EDGE;
    const left = startLeft + x.get();
    const toLeft = left + SIZE / 2 < vw / 2;
    animate(x, toLeft ? -(startLeft - EDGE) : 0, { type: 'spring', stiffness: 420, damping: 34 });
  };

  const act = (fn) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <>
      <motion.button
        type="button"
        className={styles.touch}
        style={{ x, y, width: SIZE, height: SIZE }}
        drag
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={settle}
        onPointerDown={() => {
          dragged.current = false;
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!dragged.current) setOpen(true);
        }}
        aria-label="Shortcuts"
        aria-expanded={open}
      >
        <span className={styles.ring3} />
        <span className={styles.ring2} />
        <span className={styles.ring1} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className={styles.scrim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.div
              className={styles.menu}
              role="menu"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 460, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" role="menuitem" className={styles.item} onClick={act(onBack)}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M15 5l-7 7 7 7" />
                </svg>
                Back
              </button>
              <button type="button" role="menuitem" className={styles.item} onClick={act(onHome)}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="5" y="5" width="14" height="14" rx="4" />
                </svg>
                Home
              </button>
              <button type="button" role="menuitem" className={styles.item} onClick={act(onContact)}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
                Contact
              </button>
              <button type="button" role="menuitem" className={styles.item} onClick={act(onExit)}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M14 8l4 4-4 4M18 12H9" />
                </svg>
                Exit beta
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
