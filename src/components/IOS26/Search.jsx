import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppTile from './AppTile.jsx';
import { Glyph } from './icons.jsx';
import { ALL_APPS, HOME_PAGES } from './apps.js';
import styles from './overlays.module.css';

/* Search: pull down on the home screen. Finds any app, game or project;
   Siri Suggestions are the apps worth opening first. */
const SUGGESTED = ['about', 'resume', 'design', 'work'];

export default function Search({ open, onClose, onOpenApp, onOpenFolder }) {
  const [q, setQ] = useState('');
  const input = useRef(null);
  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  const all = useMemo(() => [...HOME_PAGES.flat(), ...ALL_APPS.filter((a) => !HOME_PAGES.flat().some((h) => h.id === a.id))], []);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return all.filter((a) => a.label.toLowerCase().includes(t)).slice(0, 8);
  }, [q, all]);
  const sugg = SUGGESTED.map((id) => HOME_PAGES.flat().find((a) => a.id === id)).filter(Boolean);
  const go = (a) => (a.folder ? onOpenFolder(a.folder) : onOpenApp(a, null));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-label="Search">
          <motion.div initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 36 }} className={styles.searchTop}>
            <label className={styles.searchField}>
              <Glyph name="search" size={16} />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" autoCapitalize="off" autoCorrect="off" aria-label="Search" />
            </label>
            <button type="button" className={styles.searchCancel} onClick={onClose}>
              Cancel
            </button>
          </motion.div>
          {q.trim() ? (
            <div className={styles.searchList}>
              {results.length === 0 && <div className={styles.searchEmpty}>No results for “{q}”</div>}
              {results.map((a) => (
                <button key={a.id} type="button" className={styles.searchRow} onClick={() => go(a)}>
                  <span className={styles.searchIcon}>
                    {a.folder ? (
                      <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '22%', background: 'rgba(255,255,255,0.3)' }} />
                    ) : (
                      <AppTile app={a} />
                    )}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.searchSugg}>
              <div className={styles.searchHead}>Siri Suggestions</div>
              <div className={styles.searchGrid}>
                {sugg.map((a) => (
                  <button key={a.id} type="button" className={styles.searchApp} onClick={() => go(a)} aria-label={a.label}>
                    <span className={styles.searchBig}>{a.folder ? <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '22%', background: 'rgba(255,255,255,0.3)' }} /> : <AppTile app={a} />}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
