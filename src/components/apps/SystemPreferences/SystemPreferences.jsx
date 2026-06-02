import { useState } from 'react';
import { useOS } from '../../../context/OSContext.jsx';
import styles from './SystemPreferences.module.css';

const WALLPAPERS = [
  { id: 'default', label: 'Default', className: styles.wDefault },
  { id: 'aurora', label: 'Aurora', className: styles.wAurora },
  { id: 'midnight', label: 'Midnight', className: styles.wMidnight },
  { id: 'mesh', label: 'Mesh', className: styles.wMesh },
];

export default function SystemPreferences() {
  const { wallpaper, setWallpaper, unlock } = useOS();
  const [section, setSection] = useState('desktop');

  const selectWallpaper = (id) => {
    setWallpaper(id);
    unlock('wallpaper_change');
  };

  return (
    <div className={styles.prefs}>
      <nav className={styles.nav}>
        <button
          type="button"
          className={`${styles.navBtn} ${section === 'desktop' ? styles.navBtnActive : ''}`}
          onClick={() => setSection('desktop')}
        >
          Desktop
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${section === 'about' ? styles.navBtnActive : ''}`}
          onClick={() => setSection('about')}
        >
          About OS
        </button>
      </nav>
      <div className={styles.panel}>
        {section === 'desktop' && (
          <>
            <h2>Wallpaper</h2>
            <div className={styles.wallpapers}>
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`${styles.wallOption} ${w.className} ${
                    wallpaper === w.id ? styles.wallSelected : ''
                  }`}
                  onClick={() => selectWallpaper(w.id)}
                >
                  <span className={styles.wallLabel}>{w.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {section === 'about' && (
          <>
            <h2>About Kenneth OS</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Portfolio v1.0 — React 19 + Vite. A macOS-inspired desktop experience built as a
              design lead showcase.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
