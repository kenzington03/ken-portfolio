import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppTile from './AppTile.jsx';
import styles from './overlays.module.css';

/* The app switcher: swipe up from the bottom of an app and hold. Your recent
   apps as cards, side by side. Tap one to go back to it; flick one up to close
   it; tap the empty space to go home.

   A card is the app's icon on its own colour (the page behind it is not
   re-drawn), which is cheap and never stale. */
function Card({ app, active, onOpen, onClose, index }) {
  const start = useRef(null);
  const [dy, setDy] = useState(0);
  const [gone, setGone] = useState(false);

  const down = (e) => {
    start.current = { y: e.clientY, moved: false };
  };
  const move = (e) => {
    const s = start.current;
    if (!s) return;
    const d = e.clientY - s.y;
    if (d < -6) {
      s.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (s.moved) setDy(Math.min(0, d));
  };
  const up = () => {
    const s = start.current;
    start.current = null;
    if (s?.moved && dy < -90) {
      setGone(true);
      setTimeout(onClose, 220);
    } else setDy(0);
    // a drag is not a tap
    if (s?.moved) s.moved = 'swiped';
    start.current = null;
    lastSwipe = s?.moved ? performance.now() : lastSwipe;
  };

  return (
    <motion.div
      className={styles.swCard}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: gone ? 0 : 1, y: gone ? -420 : 0, scale: 1 }}
      exit={{ opacity: 0, y: -200 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34, delay: gone ? 0 : index * 0.04 }}
    >
      <div className={styles.swHead}>
        <span className={styles.swHeadIcon}>
          <AppTile app={app} />
        </span>
        {app.label}
      </div>
      <button
        type="button"
        className={styles.swBody}
        style={{ transform: dy ? `translateY(${dy}px)` : undefined, transition: dy ? 'none' : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)', boxShadow: active ? '0 0 0 2px rgba(255,255,255,0.55)' : undefined }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClick={() => performance.now() - lastSwipe > 400 && onOpen()}
        aria-label={`Open ${app.label}`}
      >
        <span className={styles.swIcon}>
          <AppTile app={app} />
        </span>
        <span className={styles.swName}>{app.label}</span>
      </button>
    </motion.div>
  );
}
let lastSwipe = 0;

export default function Switcher({ open, recents, activeKey, onOpen, onClose, onDismiss, onHome }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.switcher} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={(e) => e.target === e.currentTarget && onHome()} role="dialog" aria-label="Recent apps">
          <div className={styles.swRow} onClick={(e) => e.target === e.currentTarget && onHome()}>
            {recents.map((a, i) => (
              <Card key={a.appKey} app={a} index={i} active={a.appKey === activeKey} onOpen={() => onOpen(a)} onClose={() => onClose(a)} />
            ))}
          </div>
          <div className={styles.swHint}>Flick a card up to close it</div>
          <button type="button" className={styles.swClear} onClick={onDismiss}>
            Close all
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
