import { useEffect, useRef, useState } from 'react';
import AppIcon from './AppIcon.jsx';
import styles from './FolderOverlay.module.css';

export default function FolderOverlay({ folder, onClose, onAppTap }) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (folder) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [folder]);

  if (!folder) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 260);
  };

  const handleAppTap = (app) => {
    handleClose();
    setTimeout(() => onAppTap?.(app), 260);
  };

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.panel} ${visible ? styles.panelVisible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Folder name */}
        <p className={styles.folderName}>{folder.label}</p>

        {/* App grid inside folder */}
        <div className={styles.grid}>
          {(folder.apps || []).map((app) => (
            <AppIcon
              key={app.id}
              app={app}
              wiggle={false}
              showBadge={false}
              onTap={() => handleAppTap(app)}
            />
          ))}
        </div>

        {/* Page indicator (cosmetic) */}
        {(folder.apps || []).length > 9 && (
          <div className={styles.dots}>
            <span className={`${styles.dot} ${styles.dotActive}`} />
            <span className={styles.dot} />
          </div>
        )}
      </div>
    </div>
  );
}
