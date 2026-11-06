import { useState } from 'react';
import Lightbox from './Lightbox.jsx';
import VideoCard from './VideoCard.jsx';
import { normalizeVideoEntry } from '../../utils/sectionAssets.js';
import styles from './MasonryGallery.module.css';

export default function MasonryGallery({ images = [], videos = [] }) {
  const [open, setOpen] = useState(null); // which piece is big, by its place in `items`

  const normalizedVideos = videos.map(normalizeVideoEntry).filter(Boolean);
  const hasMedia = images.length > 0 || normalizedVideos.length > 0;
  if (!hasMedia) return null;

  // Everything here, in the order shown, so the big view can go through it.
  const items = [
    ...normalizedVideos.map((v) => ({ type: 'video', src: v.src, poster: v.poster })),
    ...images.map((src) => ({ type: 'image', src })),
  ];
  const openVideo = (video) => setOpen(normalizedVideos.indexOf(video));

  return (
    <>
      <div className={styles.masonry}>
        {normalizedVideos.map((video) => (
          <VideoCard key={video.src} video={video} onOpen={openVideo} />
        ))}
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            className={styles.item}
            onClick={() => setOpen(normalizedVideos.length + i)}
          >
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  );
}
