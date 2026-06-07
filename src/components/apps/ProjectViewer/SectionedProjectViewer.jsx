import { useRef } from 'react';
import { getNextProject, getProjectLogoUrl } from '../../../data/projects.js';
import { getTagLabel } from '../../../data/tags.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import { useOS } from '../../../context/OSContext.jsx';
import { useSectionedProject } from '../../../hooks/useSectionedProject.js';
import MasonryGallery from '../../Media/MasonryGallery.jsx';
import ProjectSectionTabs from './ProjectSectionTabs.jsx';
import styles from './SectionedProjectViewer.module.css';

export default function SectionedProjectViewer({ project, overview, sectionsConfig }) {
  const { openProject } = useOS();
  const scrollRef = useRef(null);
  const { sections, loading } = useSectionedProject(project.folder, sectionsConfig);

  const tabSections = sections.map((s) => ({ id: s.id, label: s.label }));
  const nextProject = getNextProject(project.id);
  const logo = getProjectLogoUrl(project);

  const openNext = (e) => {
    openProject(nextProject.id, { animationOrigin: getOriginFromEvent(e) });
  };

  return (
    <div className={styles.viewer}>
      <div className={styles.scroll} ref={scrollRef}>
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
          {!loading && tabSections.length > 0 && (
            <ProjectSectionTabs sections={tabSections} scrollRootRef={scrollRef} />
          )}
        </header>

        <div className={styles.content}>
          {overview && (
            <section id="overview" className={styles.overview}>
              <p className={styles.overviewText}>{overview}</p>
            </section>
          )}

          {loading && <p className={styles.loading}>Loading…</p>}

          {!loading &&
            sections.map((section) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <h2 className={styles.sectionTitle}>{section.label}</h2>
                {section.images.length === 0 && !(section.videos?.length > 0) ? (
                  <p className={styles.emptyMedia}>[ no media in this section ]</p>
                ) : (
                  <MasonryGallery images={section.images} videos={section.videos ?? []} />
                )}
              </section>
            ))}

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
