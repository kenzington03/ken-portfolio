import styles from './Coachmark.module.css';

/**
 * Small one-time tooltip bubble used for first-visit hints ("psst, you can
 * switch views here"). Positioned by the parent (give the parent
 * `position: relative` and place <Coachmark> as a child); `placement`
 * controls which edge the arrow points from.
 */
export default function Coachmark({ show, onDismiss, children, placement = 'bottom' }) {
  if (!show) return null;

  return (
    <div className={`${styles.coachmark} ${styles[placement] ?? styles.bottom}`} role="tooltip">
      <div className={styles.bubble}>
        <span className={styles.text}>{children}</span>
        <button type="button" className={styles.gotIt} onClick={onDismiss}>
          Got it
        </button>
      </div>
      <span className={styles.arrow} aria-hidden />
    </div>
  );
}
