// Ken's wallpapers that are drawn rather than photographed.
//   PosterWall  his name from the hero, printed huge across the desk in the
//               poster's two inks, cropped by the screen's edges.

import { useMemo } from 'react';
import { readPalette } from '../Journey/C/palette.js';
import styles from './Wallpaper.module.css';

export function PosterWall() {
  const palette = useMemo(readPalette, []);
  return (
    <div className={`${styles.wallpaper} ${styles.poster}`} style={{ '--pop': palette.pop, '--pop-2': palette.pop2 }} aria-hidden>
      <span className={styles.posterName}>
        <span className={styles.posterFill}>KENNETH</span>
        <span className={styles.posterInk}>KENNETH</span>
      </span>
      <span className={styles.posterCredit}>Kenneth Nathanael · Designer · India</span>
    </div>
  );
}
