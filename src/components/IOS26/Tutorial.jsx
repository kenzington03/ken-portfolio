import { AnimatePresence, motion } from 'framer-motion';
import { TipsList } from './screens.jsx';
import styles from './overlays.module.css';

/* A short "how to use this phone", over the screen: shown once, the first time
   the home screen appears, and again from Help or Settings. */
export default function Tutorial({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.tutBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-label="How to use this phone"
        >
          <motion.div
            className={styles.tutCard}
            initial={{ y: 30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.tutTitle}>Welcome</div>
            <div className={styles.tutSub}>It's an iPhone, inside your phone. Here's how to get around.</div>
            <TipsList />
            <button type="button" className={styles.tutBtn} onClick={onClose}>
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
