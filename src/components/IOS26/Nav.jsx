import { usePhone } from './PhoneContext.js';
import styles from './screens.module.css';

const Chevron = () => (
  <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
    <path d="M10 2L2 10l8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The bar under the status bar: a back link (home) on the left. */
export default function Nav({ label = 'Home', right }) {
  const { close } = usePhone();
  return (
    <div className={styles.nav}>
      <button type="button" className={styles.back} onClick={close}>
        <Chevron />
        {label}
      </button>
      {right}
    </div>
  );
}
