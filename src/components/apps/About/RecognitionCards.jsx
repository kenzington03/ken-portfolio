import { KUDOS_QUOTES } from '../../../data/kudosQuotes.js';
import styles from './RecognitionCards.module.css';

export default function RecognitionCards() {
  return (
    <div className={styles.grid}>
      {KUDOS_QUOTES.map((item, index) => (
        <blockquote key={`${item.name}-${index}`} className={styles.card}>
          <p className={styles.quote}>&ldquo;{item.quote}&rdquo;</p>
          <footer className={styles.footer}>
            <cite className={styles.name}>{item.name}</cite>
            <span className={styles.role}>{item.role}</span>
          </footer>
        </blockquote>
      ))}
    </div>
  );
}
