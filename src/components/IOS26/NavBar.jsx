import { Glyph } from './icons.jsx';
import styles from './overlays.module.css';

/* The bar under the phone: Home, Back, Help.

   The phone is a picture inside a browser, and a browser keeps its own
   gestures (the bottom edge is Safari's, the left edge is "back"), so a swipe
   is not a reliable way to move around. This is: always visible, big enough
   to hit, outside the phone's glass so it is clear it belongs to the site. */
export default function NavBar({ onHome, onBack, onHelp, canBack }) {
  return (
    <nav className={styles.bar} aria-label="Phone navigation">
      <button type="button" className={styles.barBtn} onClick={onBack} disabled={!canBack} aria-label="Back">
        <Glyph name="back" size={20} />
        <span>Back</span>
      </button>
      <button type="button" className={`${styles.barBtn} ${styles.barHome}`} onClick={onHome} aria-label="Home">
        <Glyph name="home" size={22} />
        <span>Home</span>
      </button>
      <button type="button" className={styles.barBtn} onClick={onHelp} aria-label="How to use this phone">
        <Glyph name="help" size={20} />
        <span>Help</span>
      </button>
    </nav>
  );
}
