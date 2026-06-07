import { useState } from 'react';
import Lightbox from './Lightbox.jsx';
import VideoCard from './VideoCard.jsx';
import { normalizeVideoEntry } from '../../utils/sectionAssets.js';
import styles from './MasonryGallery.module.css';

export default function MasonryGallery({ images = [], videos = [] }) {
  const [lightboxItem, setLightboxItem] = useState(null);

  const normalizedVideos = videos.map(normalizeVideoEntry).filter(Boolean);
  const hasMedia = images.length > 0 || normalizedVideos.length > 0;
  if (!hasMedia) return null;

  const openVideo = (video) => {
    setLightboxItem({ type: 'video', src: video.src, poster: video.poster });
  };

  return (
    <>
      <div className={styles.masonry}>
        {normalizedVideos.map((video) => (
          <VideoCard key={video.src} video={video} onOpen={openVideo} />
        ))}
        {images.map((src) => (
          <button
            key={src}
            type="button"
            className={styles.item}
            onClick={() => setLightboxItem({ type: 'image', src })}
          >
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </>
  );
}
