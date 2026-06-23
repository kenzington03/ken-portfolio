import { useRef } from 'react';
import styles from './AppIcon.module.css';

const LONG_PRESS_MS = 500;

export default function AppIcon({ app, wiggle, showBadge, onTap, onLongPress }) {
  const timerRef = useRef(null);
  const moved = useRef(false);

  const startPress = () => {
    moved.current = false;
    timerRef.current = setTimeout(() => {
      if (!moved.current) onLongPress?.();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    clearTimeout(timerRef.current);
  };

  const handleMove = () => {
    moved.current = true;
    clearTimeout(timerRef.current);
  };

  const handleClick = () => {
    if (!moved.current) onTap?.();
  };

  return (
    <div className={styles.iconWrap}>
      <button
        type="button"
        className={`${styles.iconBtn} ${wiggle ? styles.wiggle : ''}`}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchMove={handleMove}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onClick={handleClick}
        aria-label={app.label}
      >
        <div
          className={styles.iconFace}
          style={app.style ? { background: app.style } : undefined}
        >
          {app.imgSrc ? (
            <img src={app.imgSrc} alt="" className={styles.iconImg}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <span className={styles.iconSvg} aria-hidden="true">{app.icon}</span>
          )}
        </div>
        {wiggle && showBadge && (
          <span className={styles.badge} aria-hidden="true">✕</span>
        )}
      </button>
      <span className={styles.label}>{app.label}</span>
    </div>
  );
}
