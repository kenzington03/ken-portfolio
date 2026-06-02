import { useEffect } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Achievements.module.css';

export default function AchievementToast() {
  const { showToast, dismissToast } = useOS();

  useEffect(() => {
    if (!showToast) return;
    const id = setTimeout(dismissToast, 4000);
    return () => clearTimeout(id);
  }, [showToast, dismissToast]);

  if (!showToast) return null;

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
