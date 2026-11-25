import { AnimatePresence, motion } from 'framer-motion';
import AppTile from './AppTile.jsx';
import { FOLDERS } from './apps.js';
import styles from './overlays.module.css';

/* An open folder: the screen blurs behind it, the name sits above a glass
   panel of its apps. Tap outside to close, tap an app to open it. */
export default function FolderOverlay({ folderKey, onClose, onOpenApp }) {
  const folder = folderKey ? FOLDERS[folderKey] : null;
  return (
    <AnimatePresence>
      {folder && (
        <motion.div
          key={folderKey}
          className={styles.folderBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          <motion.div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ scale: 0.82, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.folderTitle}>{folder.title}</div>
            <div className={styles.folderPanel}>
              {folder.apps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  className={styles.folderCell}
                  onClick={(e) => onOpenApp(app, e.currentTarget.querySelector('[data-icon]'))}
                  aria-label={app.label}
                >
                  <div data-icon className={styles.folderIcon}>
                    <AppTile app={app} />
                  </div>
                  <span className={styles.folderLabel}>{app.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
