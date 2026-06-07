import { getNextProject, getProjectLogoUrl } from '../../../data/projects.js';
import { MOTION_VIDEO_CONFIG } from '../../../data/projectSections.js';
import { getTagLabel } from '../../../data/tags.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import { useOS } from '../../../context/OSContext.jsx';
import { useMotionVideos } from '../../../hooks/useMotionVideos.js';
import MasonryGallery from '../../Media/MasonryGallery.jsx';
import styles from './SectionedProjectViewer.module.css';

export default function VideoProjectViewer({ project }) {
  const { openProject } = useOS();
  const { videos, loading } = useMotionVideos(
    project.folder,
    MOTION_VIDEO_CONFIG.videoSubfolders,
    MOTION_VIDEO_CONFIG.maxVideosPerPath,
    project.videoKeys ?? MOTION_VIDEO_CONFIG.videoKeys ?? []
  );

  const nextProject = getNextProject(project.id);
  const logo = getProjectLogoUrl(project);

  const openNext = (e) => {
    openProject(nextProject.id, { animationOrigin: getOriginFromEvent(e) });
  };

  return (
    <div className={styles.viewer}>
      <div className={styles.scroll}>
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

        <div className={styles.content}>
          <p className={styles.overview}>{MOTION_VIDEO_CONFIG.overview}</p>

          {loading && <p className={styles.loading}>Loading videos…</p>}

          {!loading && videos.length === 0 && (
            <p className={styles.emptyMedia}>[ no videos found ]</p>
          )}

          {!loading && videos.length > 0 && <MasonryGallery videos={videos} />}

          <footer className={styles.footer}>
            <button type="button" className={styles.nextLink} onClick={openNext}>
              Next Project →
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
