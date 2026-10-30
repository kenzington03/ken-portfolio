// Who Ken has worked with (one marquee, the only one on the page) and what
// the people he works with say. Real quotes from the kudos wall, trimmed.

import { motion } from 'framer-motion';
import { CLIENTS } from '../../data/about.js';
import { KUDOS_QUOTES } from '../../data/kudosQuotes.js';
import styles from './Intro4.module.css';

const QUOTES = [KUDOS_QUOTES[4], KUDOS_QUOTES[3]]
  .filter(Boolean)
  .map((q) => ({ ...q, quote: q.quote.replace(/\s*[—–]\s*/g, '. ').replace(/\.\s+(\w)/g, (m, c) => `. ${c.toUpperCase()}`) }));

const EASE = [0.16, 1, 0.3, 1];

export default function Proof({ reduced }) {
  const loop = [...CLIENTS, ...CLIENTS];
  return (
    <section id="proof" className={styles.proof} aria-label="Clients and kind words">
      <h2 className={styles.proofTitle}>Trusted by</h2>
      <div className={styles.marquee} aria-label={CLIENTS.join(', ')} role="img">
        <div className={styles.marqueeTrack} aria-hidden>
          {loop.map((c, i) => (
            <span key={`${c}-${i}`}>{c}</span>
          ))}
        </div>
      </div>

      <div className={styles.quotes}>
        {QUOTES.map((q, i) => (
          <motion.figure
            key={q.quote}
            className={`${styles.quote} ${i ? styles.quoteSmall : ''}`}
            initial={reduced ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
          >
            <blockquote>“{q.quote}”</blockquote>
            <figcaption>
              {q.name}
              <small>{q.role}</small>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
