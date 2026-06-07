import styles from './Dock.module.css';

export default function DockIcon({ src, label }) {
  return (
    <img
      src={src}
      alt={label}
      width={48}
      height={48}
      className={styles.dockImg}
      style={{ objectFit: 'contain', borderRadius: 0 }}
      draggable={false}
    />
  );
}
