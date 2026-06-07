import { useEffect } from 'react';
import { isExternalMediaUrl } from '../../utils/sectionAssets.js';
import styles from './Lightbox.module.css';

export default function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  const externalVideo = item.type === 'video' && isExternalMediaUrl(item.src);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.inner} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
        {item.type === 'video' ? (
          <video
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
          <img src={item.src} alt="" className={styles.media} />
        )}
      </div>
    </div>
  );
}
