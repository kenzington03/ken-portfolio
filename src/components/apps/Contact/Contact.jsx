import styles from './Contact.module.css';

export default function Contact() {
  return (
    <div className={styles.contact}>
      <div className={styles.heroAvatar} aria-hidden />
      <h1 className={styles.name}>Kenneth Nathanael</h1>
      <p className={styles.subtitle}>Design Lead · Milestone Technologies</p>

      <div className={styles.actions}>
        <a className={styles.actionBtn} href="tel:+917204662258" aria-label="Call">
          <span className={styles.actionIcon}>📞</span>
          <span className={styles.actionLabel}>call</span>
        </a>
        <a className={styles.actionBtn} href="mailto:kennethnathanael@gmail.com" aria-label="Mail">
          <span className={styles.actionIcon}>✉</span>
          <span className={styles.actionLabel}>mail</span>
        </a>
        <a
          className={styles.actionBtn}
          href="https://linkedin.com/in/kenneth-n-576134103"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <span className={styles.actionIcon}>in</span>
          <span className={styles.actionLabel}>linkedin</span>
        </a>
        <a
          className={styles.actionBtn}
          href="https://behance.net/nathanaelkenneth"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Behance"
        >
          <span className={styles.actionIcon}>Be</span>
          <span className={styles.actionLabel}>behance</span>
        </a>
        <a
          className={styles.actionBtn}
          href="https://instagram.com/nathanaelkenneth"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <span className={styles.actionIcon}>📷</span>
          <span className={styles.actionLabel}>instagram</span>
        </a>
      </div>

      <div className={styles.infoList}>
        <a className={styles.infoRow} href="tel:+917204662258">
          <span className={styles.infoLabel}>mobile</span>
          <span className={styles.infoValue}>+91 72046 62258</span>
        </a>
        <a className={styles.infoRow} href="mailto:kennethnathanael@gmail.com">
          <span className={styles.infoLabel}>email</span>
          <span className={styles.infoValue}>kennethnathanael@gmail.com</span>
        </a>
        <a
          className={styles.infoRow}
          href="https://linkedin.com/in/kenneth-n-576134103"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.infoLabel}>linkedin</span>
          <span className={styles.infoValue}>linkedin.com/in/kenneth-n-576134103</span>
        </a>
        <a
          className={styles.infoRow}
          href="https://behance.net/nathanaelkenneth"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.infoLabel}>behance</span>
          <span className={styles.infoValue}>behance.net/nathanaelkenneth</span>
        </a>
        <a
          className={styles.infoRow}
          href="https://instagram.com/nathanaelkenneth"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.infoLabel}>instagram</span>
          <span className={styles.infoValue}>@nathanaelkenneth</span>
        </a>
        <div className={styles.infoRowStatic}>
          <span className={styles.infoLabel}>location</span>
          <span className={styles.infoValuePlain}>Hyderabad, India</span>
        </div>
      </div>

      <p className={styles.cta}>Open to Design Lead and Creative Director opportunities.</p>
    </div>
  );
}
