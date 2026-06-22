import { useEffect, useState } from 'react';
import styles from './AdobeSplashOverlay.module.css';

const OPEN_DELAY_MS = 480;
const ERROR_DELAY_MS = 30_000;

export default function AdobeSplashOverlay({ label, imageSrc, onClose }) {
  const [visible, setVisible] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => setVisible(true), OPEN_DELAY_MS);
    return () => clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const errorTimer = setTimeout(() => setShowError(true), ERROR_DELAY_MS);
    return () => clearTimeout(errorTimer);
  }, [visible]);

  const close = () => onClose();

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${label} splash`}>
      <div className={`${styles.splashWrap} ${visible ? styles.splashWrapVisible : ''}`}>
        <div className={styles.splashFrame}>
          <img src={imageSrc} alt={`${label} splash screen`} className={styles.splashImage} draggable={false} />
        </div>

        {showError && (
          <div className={styles.errorDialog}>
            <p className={styles.errorTitle}>Unable to open</p>
            <p className={styles.errorMessage}>
              {label} could not be launched. The application may be unavailable on this system.
            </p>
            <div className={styles.errorActions}>
              <button type="button" className={styles.errorPrimary} onClick={close}>
                Submit Report
              </button>
              <button type="button" className={styles.errorSecondary} onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
