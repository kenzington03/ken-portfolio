import styles from './Desktop.module.css';

export default function DesktopIcon({ src, label }) {
  return (
    <img
      src={src}
      alt={label}
      width={48}
      height={48}
      className={styles.iconImg}
      style={{ objectFit: 'contain', borderRadius: 0 }}
      draggable={false}
    />
  );
}
