import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isExternalMediaUrl } from '../../utils/sectionAssets.js';
import { altFor } from '../../utils/altText.js';
import styles from './Lightbox.module.css';

/**
 * One piece of the work, big. With `items` (the gallery it's from) and
 * `index`, you can go through them: the arrows either side, ← and → on the
 * keyboard, or a swipe; it wraps round at the ends. It covers the whole
 * screen (rendered at the top of the page, not inside its window).
 */
export default function Lightbox({ items = [], index = null, onIndex, onClose }) {
  const item = index == null ? null : items[index];
  const many = items.length > 1;
  const swipe = useRef(null);
  const go = (step) => onIndex?.((index + step + items.length) % items.length);

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (many && e.key === 'ArrowRight') go(1);
      else if (many && e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!item) return null;

  const externalVideo = item.type === 'video' && isExternalMediaUrl(item.src);
  const arrow = (step, label, d) => (
    <button
      type="button"
      className={`${styles.nav} ${step < 0 ? styles.prev : styles.next}`}
      onClick={(e) => {
        e.stopPropagation();
        go(step);
      }}
      aria-label={label}
    >
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d={d} />
      </svg>
    </button>
  );

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onTouchStart={(e) => {
        // (Not on a video: sliding along its timeline isn't a swipe.)
        swipe.current = e.target.tagName === 'VIDEO' ? null : e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (swipe.current ?? e.changedTouches[0].clientX);
        swipe.current = null;
        if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      {many && arrow(-1, 'Previous', 'M10 3L5 8l5 5')}
      <div className={styles.inner} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
        {item.type === 'video' ? (
          <video
            key={item.src}
            src={item.src}
            poster={item.poster ?? undefined}
            controls
            autoPlay
            muted={false}
            playsInline
            crossOrigin={externalVideo ? 'anonymous' : undefined}
            className={styles.media}
          />
        ) : (
          <img key={item.src} src={item.src} alt={item.alt ?? altFor(item.src)} className={styles.media} />
        )}
        {many && (
          <p className={styles.count}>
            {index + 1} / {items.length}
          </p>
        )}
      </div>
      {many && arrow(1, 'Next', 'M6 3l5 5-5 5')}
    </div>,
    document.body,
  );
}
