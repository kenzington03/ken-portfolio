import { useRef, useState } from 'react';
import { isExternalMediaUrl } from '../../utils/sectionAssets.js';
import styles from './MasonryGallery.module.css';

export default function VideoCard({ video, onOpen }) {
  const videoRef = useRef(null);
  const [hoverPlaying, setHoverPlaying] = useState(false);
  const external = isExternalMediaUrl(video.src);
  const posterUrl = video.poster ?? undefined;

  const handleEnter = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play()
      .then(() => setHoverPlaying(true))
      .catch(() => setHoverPlaying(false));
  };

  const handleLeave = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setHoverPlaying(false);
  };

  return (
    <button
      type="button"
      className={`${styles.item} ${styles.videoItem} ${video.featured ? styles.featuredItem : ''}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => onOpen(video)}
      aria-label={video.featured ? 'Play featured video' : 'Play video'}
    >
      {posterUrl && !hoverPlaying && (
        <img src={posterUrl} alt="" className={styles.videoPoster} loading="lazy" />
      )}
      <video
        ref={videoRef}
        src={video.src}
        poster={posterUrl}
        preload="metadata"
        muted
        loop
        playsInline
        crossOrigin={external ? 'anonymous' : undefined}
        className={`${styles.videoThumb} ${hoverPlaying ? styles.videoThumbPlaying : ''}`}
      />
      {!hoverPlaying && (
        <span className={styles.playIcon} aria-hidden>
          ▶
        </span>
      )}
      {video.featured && (
        <span className={styles.featuredBadge} aria-hidden>
          Featured
        </span>
      )}
    </button>
  );
}
