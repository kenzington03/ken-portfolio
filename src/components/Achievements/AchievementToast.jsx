import { useEffect, useState } from 'react';

// Nothing pops up while the desk is still arriving (the hello, the ring,
// Portfolio opening): toasts wait until it has settled.
const SETTLE_MS = 6500;
import { useOS } from '../../context/OSContext.jsx';
import styles from './Achievements.module.css';

export default function AchievementToast() {
  const { showToast, dismissToast } = useOS();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSettled(true), SETTLE_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!showToast || !settled) return;
    const id = setTimeout(dismissToast, 4000);
    return () => clearTimeout(id);
  }, [showToast, dismissToast, settled]);

  if (!showToast || !settled) return null;

  return (
    <div className={styles.toast} role="status">
      <span className={styles.toastIcon}>{showToast.icon}</span>
      <div>
        <div className={styles.toastTitle}>Achievement unlocked</div>
        <div className={styles.toastTitle}>{showToast.title}</div>
        <div className={styles.toastDesc}>{showToast.description}</div>
      </div>
    </div>
  );
}
