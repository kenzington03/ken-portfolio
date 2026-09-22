import { useState } from 'react';
import styles from './Desktop.module.css';

/** App icon: an image file when one exists, otherwise a generic macOS-style
 * squircle glyph (gradient + SVG icon) so new apps don't need custom art. */
export default function DesktopIcon({ src, label, icon, bg }) {
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

  return (
    <img
      src={src}
      alt={label}
      width={48}
      height={48}
      className={styles.iconImg}
      style={{ objectFit: 'contain', borderRadius: 0 }}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
