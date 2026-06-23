import { useEffect, useRef, useState } from 'react';
import styles from './MobileSpotlight.module.css';

export default function MobileSpotlight({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.inner} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            <line x1="10.3" y1="10.3" x2="14" y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
        </div>
        {query && (
          <p className={styles.noResults}>No results for &ldquo;{query}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
