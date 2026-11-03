import styles from './EmptyFolder.module.css';

/** A folder made on the desktop: empty, as a new one is. */
export default function EmptyFolder() {
  return (
    <div className={styles.folder}>
      <svg className={styles.icon} viewBox="0 0 64 52" aria-hidden>
        <path d="M2 8a4 4 0 0 1 4-4h16l6 6h30a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
      </svg>
      <p>This folder is empty.</p>
    </div>
  );
}
