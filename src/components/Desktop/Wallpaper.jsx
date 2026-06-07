import { useOS } from '../../context/OSContext.jsx';
import { getWallpaperById } from '../../data/wallpapers.js';
import styles from './Wallpaper.module.css';

export default function Wallpaper() {
  const { wallpaper } = useOS();
  const config = getWallpaperById(wallpaper);

  if (config.type === 'image' && config.src) {
    return (
      <div
        className={`${styles.wallpaper} ${styles.imageWall} ${styles.grain}`}
        style={{ backgroundImage: `url("${config.src}")` }}
        aria-hidden
      />
    );
  }

  const cssClass = styles[config.cssClass] ?? styles.default;

  return (
    <div className={`${styles.wallpaper} ${cssClass} ${styles.grain}`} aria-hidden />
  );
}
