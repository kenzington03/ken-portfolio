import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.about}>
      <div className={styles.portrait}>[ portrait ]</div>
      <div className={styles.info}>
        <h1>Kenneth Nathanael</h1>
        <p className={styles.title}>Design Lead</p>
        <p className={styles.bio}>
          10 years designing brands, campaigns, interfaces, and motion. Based in Hyderabad,
          India.
        </p>
        <p className={styles.line}>
          <span className={styles.label}>Currently</span>
          Design Lead at Milestone Technologies
        </p>
        <p className={styles.line}>
          <span className={styles.label}>Open to</span>
          Design Lead and Creative Director opportunities
        </p>
        <div className={styles.links}>
          <a
            href="https://behance.net/nathanaelkenneth"
            target="_blank"
            rel="noopener noreferrer"
          >
            behance.net/nathanaelkenneth
          </a>
          <a
            href="https://linkedin.com/in/kenneth-n-576134103"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin.com/in/kenneth-n-576134103
          </a>
        </div>
      </div>
    </div>
  );
}
