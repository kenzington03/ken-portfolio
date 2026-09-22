import styles from './Dock.module.css';

export default function DockIcon({ src, label }) {
  return (
    <img
      src={src}
      alt={label}
      className={styles.dockImg}
      draggable={false}
    />
  );
}
