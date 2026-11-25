import { AnimatePresence, motion } from 'framer-motion';
import styles from './overlays.module.css';

/* A banner under the Dynamic Island, for the small things the phone says
   ("Screen Mirroring: no displays found", "Video saved to Photos"). */
export default function Toast({ text }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div key={text} className={styles.toast} initial={{ y: -40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }} role="status">
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
