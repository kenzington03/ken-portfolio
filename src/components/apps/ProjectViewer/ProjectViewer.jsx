import { getProjectById } from '../../../data/projects.js';
import styles from './ProjectViewer.module.css';

export default function ProjectViewer({ data }) {
  const project = data?.projectId ? getProjectById(data.projectId) : null;

  if (!project) {
    return <div className={styles.empty}>[ placeholder ]</div>;
  }

  return (
    <div className={styles.viewer}>
      <header className={styles.header}>
        <h1>{project.name}</h1>
        <div className={styles.meta}>
          <span className={styles.category}>{project.category}</span>
          <span>{project.year}</span>
        </div>
      </header>
      <div className={styles.body}>
        <div className={styles.images}>
          <div className={styles.imagePlaceholder}>[ images ]</div>
        </div>
        <div className={styles.details}>
          <dl>
            <dt>Role</dt>
            <dd>{project.role}</dd>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </dl>
          <p className={styles.desc}>{project.description}</p>
          <div className={styles.tags}>
            {project.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
