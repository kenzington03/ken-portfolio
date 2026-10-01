// Corner sound switch: four level bars that dance while sound is on and
// settle to a flat line when muted. The label says what a click will do.

import styles from './Intro2.module.css';

export default function SoundToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      className={`${styles.sound} ${on ? styles.soundOn : ''}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label="Sound"
      title="Sound (M)"
    >
      <span className={styles.bars} aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={styles.soundLabel}>{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}
