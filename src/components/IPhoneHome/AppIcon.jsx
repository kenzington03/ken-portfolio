import { useRef } from 'react';
import styles from './AppIcon.module.css';

const LONG_PRESS_MS = 500;

/* Mini preview grid shown on a closed folder icon */
function FolderPreview({ apps }) {
  const previewApps = apps.slice(0, 9);
  return (
    <div className={styles.folderGrid}>
      {previewApps.map((app, i) => (
        <div
          key={app.id || i}
          className={styles.folderMini}
          style={
            app.cover
              ? { backgroundImage: `url("${app.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: app.style || '#3a3a3c' }
          }
        >
          {!app.cover && app.imgSrc && (
            <img src={app.imgSrc} alt="" className={styles.folderMiniImg}
              onError={e => { e.currentTarget.style.display = 'none'; }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AppIcon({ app, wiggle, onTap, onLongPress, showBadge, dockMode }) {
  const timerRef = useRef(null);
  const movedRef = useRef(false);
  const startedRef = useRef(false);

  const onTouchStart = (e) => {
    movedRef.current = false;
    startedRef.current = true;
    timerRef.current = setTimeout(() => {
      if (!movedRef.current) onLongPress?.();
    }, LONG_PRESS_MS);
  };

  const onTouchMove = () => {
    movedRef.current = true;
    clearTimeout(timerRef.current);
  };

  const onTouchEnd = (e) => {
    clearTimeout(timerRef.current);
    if (!movedRef.current && startedRef.current) {
      e.preventDefault();
      onTap?.();
    }
    startedRef.current = false;
  };

  const onClick = (e) => {
    if (!('ontouchstart' in window)) onTap?.();
  };

  const isFolder = app.type === 'folder';

  return (
    <div className={`${styles.wrap} ${dockMode ? styles.dockWrap : ''}`}>
      <button
        type="button"
        className={`${styles.btn} ${wiggle ? styles.wiggle : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
        aria-label={app.label}
      >
        {/* Icon face */}
        <div
          className={styles.face}
          style={{ background: isFolder ? 'rgba(0,0,0,0)' : (app.style || '#3a3a3c') }}
        >
          {isFolder ? (
            <div className={styles.folderBg}>
              <FolderPreview apps={app.apps || []} />
            </div>
          ) : app.imgSrc ? (
            <img
              src={app.imgSrc}
              alt=""
              className={styles.img}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span className={styles.iconSvg}>{app.icon}</span>
          )}
        </div>

        {/* Wiggle badge */}
        {wiggle && showBadge && (
          <div className={styles.badge}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </button>

      {!dockMode && (
        <span className={styles.label}>{app.label}</span>
      )}
    </div>
  );
}
