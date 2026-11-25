import StatusBar from './StatusBar.jsx';
import AppTile from './AppTile.jsx';
import { HOME_PAGE_1, DOCK, folderFace } from './apps.js';
import styles from './ios26.module.css';

/* Home screen, Figma "Examples/Home Screen": 4 columns of 72px cells, 64px
   icons, 5px to the label, row pitch ≈100px, glass dock 103px tall. */

function Cell({ app, onOpen, hideLabel }) {
  return (
    <button
      type="button"
      className={styles.cell}
      onClick={(e) => onOpen?.(app, e.currentTarget.querySelector('[data-icon]'))}
      aria-label={app.label}
    >
      <div data-icon className={styles.iconBox}>
        {app.folder ? (
          <div className={styles.folder}>
            {folderFace(app.folder).map((a) => (
              <div key={a.id} className={styles.mini}>
                <AppTile app={a} />
              </div>
            ))}
          </div>
        ) : (
          <AppTile app={app} />
        )}
        {app.badge ? <span className={styles.badge}>{app.badge}</span> : null}
      </div>
      {!hideLabel && <span className={styles.label}>{app.label}</span>}
    </button>
  );
}

export default function HomeScreen({ locked = false, reveal = 0, time, onOpen, onSearch, onStatusTap }) {
  const empties = (4 - (HOME_PAGE_1.length % 4)) % 4;
  // While the lock screen is being dragged up, the icons fade and scale in
  // under the finger (0 = hidden, 1 = fully there), as on iOS.
  const revealing = locked && reveal > 0;
  return (
    <div
      className={`${styles.home} ${locked ? styles.homeLocked : ''}`}
      style={revealing ? { opacity: reveal, transform: `scale(${0.94 + 0.06 * reveal})`, transition: 'none' } : undefined}
    >
      <StatusBar time={time} onTap={onStatusTap} />
      <div className={styles.grid}>
        {HOME_PAGE_1.map((a) => (
          <Cell key={a.id} app={a} onOpen={onOpen} />
        ))}
        {Array.from({ length: empties }, (_, i) => (
          <div key={`e${i}`} className={`${styles.cell} ${styles.cellEmpty}`} />
        ))}
      </div>

      <button type="button" className={`${styles.search} ${styles.glass} ${styles.glassBlur}`} onClick={onSearch}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden style={{ marginTop: 1.5 }}>
          <circle cx="5" cy="5" r="3.9" stroke="#fff" strokeWidth="1.5" />
          <path d="M8 8l3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Search
      </button>

      <div className={`${styles.dock} ${styles.glass} ${styles.glassBlur}`}>
        {DOCK.map((a) => (
          <Cell key={a.id} app={a} onOpen={onOpen} hideLabel />
        ))}
      </div>
    </div>
  );
}
