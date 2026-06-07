import { useEffect, useMemo, useState } from 'react';
import { useOS } from '../../../context/OSContext.jsx';
import { WALLPAPER_OPTIONS } from '../../../data/wallpapers.js';
import styles from './SystemPreferences.module.css';

function probeImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export default function SystemPreferences() {
  const { wallpaper, setWallpaper, unlock } = useOS();
  const [section, setSection] = useState('desktop');
  const [availableIds, setAvailableIds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = new Set(['default', 'aurora', 'bg1', 'bg2', 'bg3']);
      const tubesOk = await probeImage('/assets/ui/wallpaper-tubes.jpg');
      if (tubesOk) ids.add('tubes');
      if (!cancelled) setAvailableIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const wallpapers = useMemo(() => {
    if (!availableIds) return WALLPAPER_OPTIONS.filter((w) => !w.optional);
    return WALLPAPER_OPTIONS.filter((w) => !w.optional || availableIds.has(w.id));
  }, [availableIds]);

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
              {wallpapers.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`${styles.wallOption} ${wallpaper === w.id ? styles.wallSelected : ''}`}
                  onClick={() => selectWallpaper(w.id)}
                >
                  {w.type === 'image' ? (
                    <img src={w.src} alt="" className={styles.wallThumbImg} />
                  ) : (
                    <span className={`${styles.wallThumbCss} ${styles[`thumb_${w.cssClass}`]}`} />
                  )}
                  <span className={styles.wallLabel}>{w.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {section === 'about' && (
          <>
            <h2>About Kenneth OS</h2>
            <p className={styles.aboutText}>
              Portfolio v1.0 — React 19 + Vite. A macOS-inspired desktop experience built as a
              design lead showcase.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
