import { useEffect, useRef } from 'react';
import { isExternalMediaUrl } from '../../utils/sectionAssets.js';
import styles from './MasonryGallery.module.css';

export default function VideoCard({ video, onOpen }) {
  const videoRef = useRef(null);
  const external = isExternalMediaUrl(video.src);
  const posterUrl = video.poster ?? undefined;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const tryPlay = () => {
      el.play().catch(() => {
        // autoplay blocked — do nothing, poster shows
      });
    };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) tryPlay();
          else el.pause();
        },
        { threshold: 0.25 }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }

    tryPlay();
    return undefined;
  }, []);

  return (
    <button
      type="button"
      className={`${styles.item} ${styles.videoItem} ${video.featured ? styles.featuredItem : ''}`}
      onClick={() => onOpen(video)}
      aria-label={video.featured ? 'Play featured video (with audio)' : 'Play video (with audio)'}
    >
      <video
        ref={videoRef}
        src={video.src}
        poster={posterUrl}
        preload="metadata"
        muted
        loop
        playsInline
        autoPlay
        crossOrigin={external ? 'anonymous' : undefined}
        className={`${styles.videoThumb} ${styles.videoThumbPlaying}`}
      />
      <span className={styles.playIcon} aria-hidden>
        ▶
      </span>
      {video.featured && (
        <span className={styles.featuredBadge} aria-hidden>
          Featured
        </span>
      )}
    </button>
  );
}
