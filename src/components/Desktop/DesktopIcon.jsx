import { useState } from 'react';
import styles from './Desktop.module.css';

/** App icon: an image file when one exists, otherwise a generic macOS-style
 * squircle glyph (gradient + SVG icon) so new apps don't need custom art. */
export default function DesktopIcon({ src, icon, bg }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (icon) {
      return (
        <div className={styles.iconFallback} style={{ background: bg }}>
          {icon}
        </div>
      );
    }
    return null;
  }

  // The name is written under the icon: the picture adds nothing to read.
  return (
    <img
      src={src}
      alt=""
      width={48}
      height={48}
      className={styles.iconImg}
      style={{ objectFit: 'contain', borderRadius: 0 }}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
