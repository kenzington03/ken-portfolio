import { ROLES, SKILLS } from '../../../data/about.js';
import RecognitionCards from './RecognitionCards.jsx';
import ContactCta from '../../shared/ContactCta.jsx';
import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.about}>
      <div className={styles.left}>
        <div className={styles.portrait} aria-hidden />
        <h1>Kenneth Nathanael</h1>
        <p className={styles.title}>Designer</p>
        <p className={styles.bio}>
          10 years designing brands, campaigns, interfaces, and motion. Based in India.
        </p>
        <div className={styles.skills}>
          {SKILLS.map((skill) => (
            <span key={skill} className={styles.skill}>
              {skill}
            </span>
          ))}
        </div>
        <div className={styles.links}>
          <a
            href="https://behance.net/nathanaelkenneth"
            target="_blank"
            rel="noopener noreferrer"
          >
            Behance
          </a>
          <a
            href="https://linkedin.com/in/kenneth-n-576134103"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
      <div className={styles.right}>
        <h2 className={styles.sectionTitle}>Experience</h2>
        <div className={styles.timeline}>
          {ROLES.map((job) => (
            <div key={`${job.company}-${job.from}`} className={styles.timelineItem}>
              <div className={styles.company}>{job.company}</div>
              <div className={styles.role}>{job.role}</div>
              <div className={styles.dates}>{job.dates}</div>
            </div>
          ))}
        </div>

        <section className={styles.recognition}>
          <h2 className={styles.sectionTitle}>Recognition</h2>
          <p className={styles.recognitionIntro}>
            Kudos and recognition from the teams I work with.
          </p>
          <RecognitionCards />
        </section>
      </div>
      <ContactCta />
    </div>
  );
}
