// Work with me: the brief. Three steps on one quiet sheet: pick what you
// need from Ken's three (finer picks open under each), say what it's for and
// who you are, and the message to Ken writes itself beside it. One send.
//
// Opened from "Work with me" (anywhere in the journey) as a sheet over the
// page (`BriefSheet`), and inline on the phone page (`Brief`).

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SERVICES } from '../../data/services.js';
import { LINKEDIN } from '../../data/links.js';
import { EMAIL, WHATSAPP, letterText, subjectLine } from './briefData.js';
import styles from './BriefSheet.module.css';

const EASE = [0.16, 1, 0.3, 1];
// On a phone, WhatsApp is how people talk; on a laptop, email.
const onPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;

export function Brief({ headingId }) {
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [about, setAbout] = useState('');
  const [name, setName] = useState('');
  const flip = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const pickCat = (id) => {
    if (cats.includes(id)) {
      // Closing a category lets go of what was picked inside it.
      const inside = SERVICES.find((s) => s.id === id).items.map((it) => it.id);
      setItems((cur) => cur.filter((x) => !inside.includes(x)));
    }
    flip(cats, setCats, id);
  };
  const text = useMemo(() => letterText({ cats, items, about: about.trim(), name: name.trim() }), [cats, items, about, name]);
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const [phone] = useState(onPhone);
  const mail = `mailto:${EMAIL}?subject=${encodeURIComponent(subjectLine(cats))}&body=${encodeURIComponent(text)}`;

  return (
    <div className={styles.brief}>
      <header className={styles.top}>
        <p className={styles.kicker}>Work with me</p>
        <h2 id={headingId} className={styles.title}>
          What are we making?
        </h2>
      </header>

      <div className={styles.steps}>
        <fieldset className={styles.step}>
          <legend className={styles.stepHead}>
            <span>01</span> What do you need?
          </legend>
          <div className={styles.cats}>
            {SERVICES.map((s) => {
              const on = cats.includes(s.id);
              return (
                <div key={s.id} className={`${styles.cat} ${on ? styles.catOn : ''}`}>
                  <button type="button" className={styles.catBtn} aria-pressed={on} onClick={() => pickCat(s.id)}>
                    <span className={styles.catName}>{s.name}</span>
                    <span className={styles.catBlurb}>{s.blurb}</span>
                    <span className={styles.tick} aria-hidden />
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        className={styles.chipsWrap}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        <div className={styles.chips} role="group" aria-label={`${s.name}: anything specific?`}>
                          {s.items.map((it) => (
                            <button key={it.id} type="button" className={styles.chip} aria-pressed={items.includes(it.id)} onClick={() => flip(items, setItems, it.id)}>
                              {it.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={styles.step}>
          <legend className={styles.stepHead}>
            <span>02</span> Tell me a little
          </legend>
          <label className={styles.field}>
            <span>It&apos;s for</span>
            <input value={about} onChange={(e) => setAbout(e.target.value.slice(0, 90))} placeholder="A café opening in March" />
          </label>
          <label className={styles.field}>
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Optional" autoComplete="name" />
          </label>
        </fieldset>
      </div>

      <section className={styles.send} aria-label="Your message">
        <p className={styles.stepHead}>
          <span>03</span> Your message
        </p>
        <p className={styles.preview} aria-live="polite">
          {text}
        </p>
        <a className={styles.primary} href={phone ? wa : mail} {...(phone ? { target: '_blank', rel: 'noreferrer' } : {})}>
          {phone ? 'Send on WhatsApp' : 'Email it to Ken'}
          <svg viewBox="0 0 20 20" aria-hidden>
            <path d="M4 10h11M11 5l5 5-5 5" />
          </svg>
        </a>
        <a className={styles.quiet} href={phone ? mail : wa} {...(phone ? {} : { target: '_blank', rel: 'noreferrer' })}>
          {phone ? 'or send it by email' : 'or send it on WhatsApp'}
        </a>
      </section>

      <footer className={styles.foot}>
        <span>Hiring?</span>
        <a href="/cv.pdf" target="_blank" rel="noreferrer">
          Résumé
        </a>
        <a href={LINKEDIN} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </footer>
    </div>
  );
}

/** The brief as a sheet over the page. */
export default function BriefSheet({ open, onClose, style }) {
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    // The page behind is scroll-driven: lock it while the sheet is up.
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      root.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open]);

  // Tab stays inside the sheet.
  const trap = (e) => {
    if (e.key !== 'Tab' || !sheetRef.current) return;
    const f = sheetRef.current.querySelectorAll('button, a[href], input');
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          style={style}
          role="dialog"
          aria-modal="true"
          aria-labelledby="brief-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          // Wheel, touch and keys over the sheet must not reach the
          // journey's scroll stepping underneath.
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') onClose();
            trap(e);
          }}
        >
          <motion.div ref={sheetRef} className={styles.sheet} initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 20 20" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
            <Brief headingId="brief-title" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
