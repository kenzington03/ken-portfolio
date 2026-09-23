import { useEffect, useMemo, useRef, useState } from 'react';
import { SEARCHABLE_APPS } from './appData.jsx';
import styles from './MobileSpotlight.module.css';

function matchApps(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCHABLE_APPS.filter((app) => app.label.toLowerCase().includes(q)).slice(0, 8);
}

export default function MobileSpotlight({ open, onClose, onOpenApp }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const results = useMemo(() => matchApps(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const handleResultTap = (app) => {
    onOpenApp?.(app);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.searchWrap} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            <line x1="10" y1="10" x2="13.5" y2="13.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
      </div>

      {query.trim() && (
        <div className={styles.results} onClick={(e) => e.stopPropagation()}>
          {results.length === 0 ? (
            <p className={styles.noResults}>No results for &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((app) => (
              <button
                key={app.id}
                type="button"
                className={styles.resultRow}
                onClick={() => handleResultTap(app)}
              >
                <div className={styles.resultIcon} style={{ background: app.style || '#3a3a3c' }}>
                  {app.imgSrc ? (
                    <img
                      src={app.imgSrc}
                      alt=""
                      className={styles.resultImg}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : app.cover ? (
                    <img src={app.cover} alt="" className={styles.resultImg} />
                  ) : (
                    app.icon
                  )}
                </div>
                <span className={styles.resultLabel}>{app.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
