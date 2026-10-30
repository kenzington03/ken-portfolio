import { ROLES } from '../../../data/about.js';
import styles from './Experience.module.css';


export default function Experience() {
  return (
    <div className={styles.experience}>
      <h1>Experience</h1>
      <div className={styles.timeline}>
        {ROLES.map((job) => (
          <div key={job.company} className={styles.item}>
            <div className={styles.company}>{job.company}</div>
            <div className={styles.role}>{job.role}</div>
            <div className={styles.dates}>{job.dates}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
