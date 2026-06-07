import { getNextProject, getProjectById, getProjectLogoUrl } from '../../../data/projects.js';
import {
  getProjectSectionConfig,
  isMotionProject,
} from '../../../data/projectSections.js';
import { getTagLabel } from '../../../data/tags.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import { useOS } from '../../../context/OSContext.jsx';
import { useProjectImages } from '../../../hooks/useProjectImages.js';
import MasonryGallery from '../../Media/MasonryGallery.jsx';
import MilestoneProjectViewer from './MilestoneProjectViewer.jsx';
import LebronProjectViewer from './LebronProjectViewer.jsx';
import SectionedProjectViewer from './SectionedProjectViewer.jsx';
import VideoProjectViewer from './VideoProjectViewer.jsx';
import styles from './ProjectViewer.module.css';

export default function ProjectViewer({ data }) {
  const project = data?.projectId ? getProjectById(data.projectId) : null;

  if (!project) {
    return <div className={styles.empty}>[ placeholder ]</div>;
  }

  if (project.folder === '02-milestone') {
    return <MilestoneProjectViewer project={project} />;
  }

  if (project.folder === '04-lebron-nike') {
    return <LebronProjectViewer project={project} />;
  }

  if (isMotionProject(project.folder)) {
    return <VideoProjectViewer project={project} />;
  }

  const sectionConfig = getProjectSectionConfig(project.folder);
  if (sectionConfig) {
    return (
      <SectionedProjectViewer
        project={project}
        overview={sectionConfig.overview}
        sectionsConfig={sectionConfig.sections}
      />
    );
  }

  return <FlatProjectViewer project={project} />;
}

function FlatProjectViewer({ project }) {
  const { openProject } = useOS();
  const { images, loading } = useProjectImages(project.folder);
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
          {project.description && project.description !== '[ placeholder ]' && (
            <p className={styles.overview}>{project.description}</p>
          )}

          {!loading && images.length === 0 && (
            <div className={styles.placeholder}>[ images ]</div>
          )}

          {!loading && images.length > 0 && <MasonryGallery images={images} />}

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
