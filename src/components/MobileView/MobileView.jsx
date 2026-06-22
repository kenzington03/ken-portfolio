import { projects, getProjectCoverUrl } from '../../data/projects.js';
import styles from './MobileView.module.css';

const SKILLS = [
  'Brand Identity',
  'Motion Graphics',
  'UI/UX',
  'Video Production',
  'Campaigns',
  'Print',
];

export default function MobileView() {
  return (
    <div className={styles.mobile}>
      <header className={styles.header}>
        <h1 className={styles.name}>Kenneth Nathanael</h1>
        <p className={styles.title}>
          Design Lead — 10 years building brands, campaigns &amp; motion
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>Work</h2>
        <div className={styles.grid}>
          {projects.map((project) => (
            <div key={project.id}>
              <div className={styles.card}>
                <img
                  src={getProjectCoverUrl(project)}
                  alt=""
                  className={styles.cardImage}
                  loading="lazy"
                />
              </div>
              <span className={styles.cardLabel}>{project.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.about}>
        <h2 className={styles.sectionTitle}>About</h2>
        <p className={styles.aboutText}>
          Design Lead at Milestone Technologies. 10 years designing brands, campaigns,
          interfaces, and motion. Based in Hyderabad, India.
        </p>
        <div className={styles.skills}>
          {SKILLS.map((skill) => (
            <span key={skill} className={styles.skill}>
              {skill}
            </span>
          ))}
        </div>
      </section>

      <a className={styles.contactBtn} href="mailto:kennethnathanael@gmail.com">
        Contact →
      </a>
    </div>
  );
}
