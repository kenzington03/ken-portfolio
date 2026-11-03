import { useEffect, useState } from 'react';
import styles from './AdobeSplashOverlay.module.css';

const OPEN_DELAY_MS = 200;
const LAUNCH_MS = 1700; // the splash, then the app opens

// The app's splash for a moment, then the app itself.
export default function AdobeSplashOverlay({ label, imageSrc, onOpen }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => setVisible(true), OPEN_DELAY_MS);
    const launch = setTimeout(() => onOpen?.(), LAUNCH_MS);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(launch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${label} splash`}>
      <div className={`${styles.splashWrap} ${visible ? styles.splashWrapVisible : ''}`}>
        <div className={styles.splashFrame}>
          <img src={imageSrc} alt={`${label} splash screen`} className={styles.splashImage} draggable={false} />
        </div>

      </div>
    </div>
  );
}
