import { useState } from 'react';
import { ROLES, SKILLS } from '../../../data/about.js';
import { BOOKING_URL } from '../../Brief/briefData.js';
import styles from './Contact.module.css';

// Ken, as a card in the Mac's Contacts: who he is and how to reach him, in
// one place (the About and Contact apps both open it). Like the real app: a
// list on the left, the card on the right, the quick actions under the name.
const PHONE = '+91 72046 62258';
const TEL = 'tel:+917204662258';
const EMAIL = 'kennethnathanael@gmail.com';
const LINKEDIN = 'https://linkedin.com/in/kenneth-n-576134103';
const INSTAGRAM = 'https://instagram.com/nathanaelkenneth';

const CARDS = [
  { id: 'ken', name: 'Kenneth Nathanael', sub: 'Designer', me: true },
  { id: 'toothless', name: 'Toothless', sub: 'Desktop cat' },
];

const Glyph = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d={d} />
  </svg>
);
const ICONS = {
  message: 'M4 5h16v11H8l-4 4z',
  call: 'M6.6 3.5 9.4 6.3 8 8.8a12 12 0 0 0 7.2 7.2l2.5-1.4 2.8 2.8-2 2.4C10.9 19.8 4.2 13.1 4.2 5.5z',
  mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
  book: 'M5 5h14v15H5zM5 9h14M9 3v4M15 3v4',
};

function Action({ href, label, icon, external }) {
  return (
    <a className={styles.action} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      <span className={styles.actionDot}>
        <Glyph d={ICONS[icon]} />
      </span>
      {label}
    </a>
  );
}

function Field({ label, children, href, external }) {
  const value = href ? (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  ) : (
    children
  );
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

function KenCard() {
  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <div className={styles.avatar} aria-hidden />
        <div>
          <h1 className={styles.name}>Kenneth Nathanael</h1>
          <p className={styles.job}>Design Lead · Milestone Technologies</p>
        </div>
      </header>
      <div className={styles.actions}>
        <Action href={`https://wa.me/917204662258`} label="message" icon="message" external />
        <Action href={TEL} label="call" icon="call" />
        <Action href={`mailto:${EMAIL}`} label="mail" icon="mail" />
        {BOOKING_URL && <Action href={BOOKING_URL} label="book" icon="book" external />}
      </div>

      <div className={styles.fields}>
        <Field label="mobile" href={TEL}>
          {PHONE}
        </Field>
        <Field label="email" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </Field>
        <Field label="LinkedIn" href={LINKEDIN} external>
          kenneth-n-576134103
        </Field>
        <Field label="Instagram" href={INSTAGRAM} external>
          @nathanaelkenneth
        </Field>
        <Field label="home page" href="https://kennethnathanael.com" external>
          kennethnathanael.com
        </Field>
        <Field label="address">India</Field>
      </div>

      <div className={styles.fields}>
        <Field label="note">
          10+ years designing brands, campaigns, interfaces and motion, mostly for products that are hard to explain. Open to
          full-time roles and freelance projects.
        </Field>
        <Field label="skills">{SKILLS.join(', ')}</Field>
      </div>

      <div className={styles.fields}>
        {ROLES.map((r, i) => (
          <Field key={`${r.company}-${r.from}`} label={i === 0 ? 'work' : ''}>
            <span className={styles.role}>
              <b>{r.company}</b> {r.role === 'Internship' ? 'Internship' : r.role}
              <i>{r.dates}</i>
            </span>
          </Field>
        ))}
      </div>
    </article>
  );
}

function ToothlessCard() {
  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <div className={`${styles.avatar} ${styles.catAvatar}`} aria-hidden />
        <div>
          <h1 className={styles.name}>Toothless</h1>
          <p className={styles.job}>Desktop cat · Ken&apos;s Mac</p>
        </div>
      </header>
      <div className={styles.fields}>
        <Field label="address">Usually the cat castle, bottom left</Field>
        <Field label="likes">Yarn, butterflies, warm windows, your cursor</Field>
        <Field label="note">Click to stroke him. Drag to pick him up. Right-click for more.</Field>
      </div>
    </article>
  );
}

export default function Contact() {
  const [open, setOpen] = useState('ken');
  return (
    <div className={styles.contacts}>
      <aside className={styles.list} aria-label="Contacts">
        <p className={styles.group}>All Contacts</p>
        {CARDS.map((c) => (
          <button key={c.id} type="button" className={`${styles.row} ${open === c.id ? styles.rowOn : ''}`} onClick={() => setOpen(c.id)}>
            <span className={`${styles.mini} ${c.id === 'toothless' ? styles.catAvatar : ''}`} aria-hidden />
            <span>
              {c.name}
              {c.me && <em className={styles.meTag}>me</em>}
            </span>
          </button>
        ))}
      </aside>
      <div className={styles.pane}>{open === 'ken' ? <KenCard /> : <ToothlessCard />}</div>
    </div>
  );
}
