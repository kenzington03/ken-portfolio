import styles from './Contact.module.css';

export default function Contact() {
  return (
    <div className={styles.contact}>
      <h1>Contact</h1>
      <div className={styles.list}>
        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <a href="mailto:kennethnathanael@gmail.com">kennethnathanael@gmail.com</a>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>LinkedIn</span>
          <a
            href="https://linkedin.com/in/kenneth-n-576134103"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin.com/in/kenneth-n-576134103
          </a>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Behance</span>
          <a
            href="https://behance.net/nathanaelkenneth"
            target="_blank"
            rel="noopener noreferrer"
          >
            behance.net/nathanaelkenneth
          </a>
        </div>
      </div>
      <p className={styles.cta}>
        Open to Design Lead and Creative Director opportunities.
      </p>
    </div>
  );
}
