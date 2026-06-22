import { useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getWallpaperById } from '../../data/wallpapers.js';
import styles from './Wallpaper.module.css';

export default function Wallpaper() {
  const { wallpaper } = useOS();
  const config = getWallpaperById(wallpaper);
  const [imageOk, setImageOk] = useState(true);

  useEffect(() => {
    if (config.type !== 'image' || !config.src) {
      setImageOk(true);
      return undefined;
    }

    setImageOk(true);
    const img = new Image();
    img.onload = () => setImageOk(true);
    img.onerror = () => setImageOk(false);
    img.src = config.src;

    return undefined;
  }, [config.type, config.src]);

  if (config.type === 'image' && config.src && imageOk) {
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
