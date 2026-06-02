import { useOS } from '../../context/OSContext.jsx';
import styles from './Wallpaper.module.css';

const WALLPAPER_CLASS = {
  default: styles.default,
  aurora: styles.aurora,
  midnight: styles.midnight,
  mesh: styles.mesh,
};

export default function Wallpaper() {
  const { wallpaper } = useOS();
  const variant = WALLPAPER_CLASS[wallpaper] ?? styles.default;

  return (
    <div
      className={`${styles.wallpaper} ${variant} ${styles.grain}`}
      aria-hidden
    />
  );
}
