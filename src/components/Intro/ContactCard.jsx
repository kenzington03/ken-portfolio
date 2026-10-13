import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ContactCard.module.css';

const EMAIL = 'kennethnathanael@gmail.com';
const PHONE = '+91 72046 62258';
const PHONE_HREF = 'tel:+917204662258';

const LINKS = [
  { label: 'LinkedIn', value: 'kenneth-n-576134103', href: 'https://linkedin.com/in/kenneth-n-576134103' },
  { label: 'Behance', value: 'nathanaelkenneth', href: 'https://behance.net/nathanaelkenneth' },
  { label: 'Instagram', value: '@nathanaelkenneth', href: 'https://instagram.com/nathanaelkenneth' },
];

/** Contacts-app style card, straight from the hero, no MacBook required. */
export default function ContactCard({ open, onClose }) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    // The page behind is the scroll-driven intro: lock it so wheel/touch over
    // the card can't drive the MacBook (or the welcome handoff) underneath.
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      root.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.card}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-card-name"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 12 12" aria-hidden>
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>

            <img className={styles.avatar} src="/assets/profile/ken.jpg" alt="" width="88" height="88" />
            <h2 id="contact-card-name" className={styles.name}>
              Kenneth Nathanael
            </h2>
            <p className={styles.role}>Design Lead · Hyderabad, India</p>

            <div className={styles.quick}>
              <a className={styles.quickBtn} href={`mailto:${EMAIL}`}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
                  <path d="M4 7.5l8 6 8-6" />
                </svg>
                mail
              </a>
              <a className={styles.quickBtn} href={PHONE_HREF}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M6.6 3.8l2.6-.6 1.6 4-2 1.4a11 11 0 0 0 6.6 6.6l1.4-2 4 1.6-.6 2.6a2 2 0 0 1-2 1.6A15.6 15.6 0 0 1 5 5.8a2 2 0 0 1 1.6-2z" />
                </svg>
                call
              </a>
              <button type="button" className={styles.quickBtn} onClick={copyEmail}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="8" y="8" width="12" height="12" rx="2.5" />
                  <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
                </svg>
                {copied ? 'copied' : 'copy'}
              </button>
            </div>

            <div className={styles.rows}>
              <a className={styles.row} href={`mailto:${EMAIL}`}>
                <span className={styles.rowLabel}>email</span>
                <span className={styles.rowValue}>{EMAIL}</span>
              </a>
              <a className={styles.row} href={PHONE_HREF}>
                <span className={styles.rowLabel}>mobile</span>
                <span className={styles.rowValue}>{PHONE}</span>
              </a>
              {LINKS.map((l) => (
                <a key={l.label} className={styles.row} href={l.href} target="_blank" rel="noopener noreferrer">
                  <span className={styles.rowLabel}>{l.label}</span>
                  <span className={styles.rowValue}>{l.value}</span>
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
