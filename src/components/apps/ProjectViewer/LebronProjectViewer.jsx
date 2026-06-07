import { useRef, useState } from 'react';
import { CLOUDINARY_VIDEOS } from '../../../data/cloudinaryVideos.js';
import { getTagLabel } from '../../../data/tags.js';
import { getProjectLogoUrl } from '../../../data/projects.js';
import HeroVideo from '../../Media/HeroVideo.jsx';
import styles from './ProjectViewer.module.css';
import heroStyles from '../../Media/HeroVideo.module.css';

export default function LebronProjectViewer({ project }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const logo = getProjectLogoUrl(project);
  const src = CLOUDINARY_VIDEOS['lebron-nike-concept'];

  const handleVideoClick = () => {
    const el = videoRef.current;
    if (!el) return;

    if (muted) {
      el.muted = false;
      setMuted(false);
      el.play().catch(() => {});
      return;
    }

    if (!paused) {
      el.pause();
      setPaused(true);
    } else {
      el.play().catch(() => {});
      setPaused(false);
    }
  };

  return (
    <div className={`${styles.viewer} ${styles.heroViewer}`}>
      <header className={styles.stickyHeader}>
        <div className={styles.headerTop}>
          <img
            src={logo}
            alt=""
            className={styles.logoBadge}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className={styles.headerText}>
            <h1 className={styles.title}>{project.name}</h1>
            <div className={styles.headerTags}>
              {(project.tags ?? []).map((tag) => (
                <span key={tag} className={styles.headerTag}>
                  {getTagLabel(tag)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className={heroStyles.heroFillWrap}>
        <HeroVideo
          src={src}
          videoRef={videoRef}
          className={`${heroStyles.heroFill} ${heroStyles.heroInteractive}`}
          onClick={handleVideoClick}
          muted={muted}
          loop
        />
        <span className={heroStyles.heroHint}>
          {muted ? 'Click to unmute' : paused ? 'Click to play' : 'Click to pause'}
        </span>
      </div>
    </div>
  );
}
