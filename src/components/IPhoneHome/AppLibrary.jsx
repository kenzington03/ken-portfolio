// The App Library: the page past the last home screen. Every app, grouped
// into categories; each tile shows three apps and a cluster of the rest, as
// iOS does. Tapping an app opens it; tapping the cluster opens the category.

import { useRef } from 'react';
import { APP_LIBRARY } from './appData.jsx';
import styles from './AppLibrary.module.css';

function Glyph({ app, small = false }) {
  // A folder shows its first apps in a mini grid, as on the home screen.
  if (app.type === 'folder') {
    return (
      <span className={`${styles.glyph} ${styles.folder} ${small ? styles.glyphSmall : ''}`}>
        {(app.apps || []).slice(0, 9).map((a) => (
          <span key={a.id} style={a.cover ? { backgroundImage: `url("${a.cover}")` } : { background: a.style || '#3a3a3c' }} />
        ))}
      </span>
    );
  }
  const style = app.cover ? { backgroundImage: `url("${app.cover}")` } : { background: app.style || '#3a3a3c' };
  return (
    <span className={`${styles.glyph} ${small ? styles.glyphSmall : ''}`} style={style}>
      {!app.cover && (app.imgSrc ? <img src={app.imgSrc} alt="" draggable={false} /> : <span className={styles.svg}>{app.icon}</span>)}
    </span>
  );
}

function Tile({ group, onOpenApp, onOpenGroup }) {
  const refs = useRef([]);
  const rect = (i) => refs.current[i]?.getBoundingClientRect() ?? null;
  const big = group.apps.length > 4 ? group.apps.slice(0, 3) : group.apps.slice(0, 4);
  const rest = group.apps.length > 4 ? group.apps.slice(3, 7) : [];
  return (
    <div className={styles.tileWrap}>
      <div className={styles.tile}>
        {big.map((app, i) => (
          <button key={app.id} type="button" className={styles.cell} ref={(el) => (refs.current[i] = el)} onClick={() => onOpenApp(app, rect(i))} aria-label={app.label}>
            <Glyph app={app} />
          </button>
        ))}
        {rest.length > 0 && (
          <button type="button" className={`${styles.cell} ${styles.cluster}`} onClick={() => onOpenGroup(group)} aria-label={`All ${group.label}`}>
            {rest.map((app) => (
              <Glyph key={app.id} app={app} small />
            ))}
          </button>
        )}
      </div>
      <span className={styles.label}>{group.label}</span>
    </div>
  );
}

export default function AppLibrary({ onOpenApp, onOpenGroup, onSearch }) {
  return (
    <div className={styles.library}>
      <button type="button" className={styles.search} onClick={onSearch}>
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.7 9.7L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        App Library
      </button>
      <div className={styles.grid}>
        {APP_LIBRARY.map((group) => (
          <Tile key={group.id} group={group} onOpenApp={onOpenApp} onOpenGroup={onOpenGroup} />
        ))}
      </div>
    </div>
  );
}
