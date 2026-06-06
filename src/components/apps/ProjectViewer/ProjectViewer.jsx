import { getProjectById } from '../../../data/projects.js';
import { useProjectImages } from '../../../hooks/useProjectImages.js';
import styles from './ProjectViewer.module.css';

export default function ProjectViewer({ data }) {
  const project = data?.projectId ? getProjectById(data.projectId) : null;
  const { images, loading } = useProjectImages(project?.folder);
  const hero = images[0];
  const gallery = images.slice(1);

  if (!project) {
    return <div className={styles.empty}>[ placeholder ]</div>;
  }

  return (
    <div className={styles.viewer}>
      <header className={styles.header}>
        <h1 className={styles.title}>{project.name}</h1>
        <div className={styles.meta}>
          <span className={styles.category}>{project.category}</span>
          <span className={styles.metaItem}>{project.year}</span>
          <span className={styles.metaItem}>{project.client}</span>
        </div>
      </header>

      {!loading && !hero && (
        <div className={styles.placeholder}>[ images ]</div>
      )}

      {hero && (
        <img src={hero} alt={project.name} className={styles.hero} />
      )}

      <div className={styles.copy}>
        <div className={styles.copyCol}>
          <span className={styles.copyLabel}>Role</span>
          <p>{project.role}</p>
        </div>
        <div className={styles.copyCol}>
          <span className={styles.copyLabel}>Description</span>
          <p>{project.description}</p>
        </div>
      </div>

      {gallery.length > 0 && (
        <div className={styles.gallery}>
          {gallery.map((src) => (
            <img key={src} src={src} alt="" className={styles.galleryImage} loading="lazy" />
          ))}
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.tags}>
          {project.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
