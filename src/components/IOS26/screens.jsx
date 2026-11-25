import { useMemo } from 'react';
import { ROLES } from '../../data/about.js';
import { BOOKING_URL, EMAIL, WHATSAPP } from '../Brief/briefData.js';
import { INSTAGRAM, LINKEDIN } from '../../data/links.js';
import useClock from '../../hooks/useClock.js';
import { Glyph } from './icons.jsx';
import AppTile from './AppTile.jsx';
import Nav from './Nav.jsx';
import { CameraApp, PhotosApp, SafariApp, SettingsApp, RemindersApp, WalletApp } from './screens2.jsx';
import { LINK_APPS } from './apps.js';
import { usePhone } from './PhoneContext.js';
import styles from './screens.module.css';

/* The app screens that are not a game or a project: each one drawn the way
   the real iOS app is, with the kit's colours (so they follow Light / Dark). */

const tel = `tel:+${WHATSAPP}`;
const phoneText = `+${WHATSAPP.replace(/^(\d{2})(\d{5})(\d+)$/, '$1 $2 $3')}`;

/* ───────── Resume: a note in Notes ───────── */

const noteStamp = (d) => `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

export function NotesResume() {
  const stamp = useClock(noteStamp);
  return (
    <div className={`${styles.screen} ${styles.notes}`}>
      <Nav label="Notes" />
      <div className={styles.scroll}>
        <div className={styles.noteDate}>{stamp}</div>
        <div className={styles.noteBody}>
          <h1 className={styles.noteTitle}>Kenneth Nathanael</h1>
          <p className={styles.noteP}>Designer · Hyderabad, India</p>
          <p className={styles.noteP}>10+ years shaping brands, campaigns and interfaces. I start with the idea and stay for the last pixel.</p>

          <h2 className={styles.noteH}>Experience</h2>
          {ROLES.map((r) => (
            <div key={`${r.company}-${r.from}`}>
              <p className={styles.noteRole}>{r.role}</p>
              <p className={styles.noteOrg}>
                {r.company} · {r.dates.replace(' - ', ' to ')}
              </p>
            </div>
          ))}

          <h2 className={styles.noteH}>Skills</h2>
          <p className={styles.noteP}>Brand identity · Motion design · Video · UI/UX · Print · Social media · Illustration</p>
          <h2 className={styles.noteH}>Tools</h2>
          <p className={styles.noteP}>Adobe CC · Figma · After Effects · Premiere Pro · Illustrator · Photoshop · InDesign</p>

          <a className={styles.attach} href="/Kenneth-Nathanael-Resume.pdf" download="Kenneth-Nathanael-Resume.pdf">
            <span className={styles.attachIcon}>PDF</span>
            <span className={styles.attachText}>
              <div className={styles.attachName}>Kenneth-Nathanael-Resume.pdf</div>
              <div className={styles.attachSub}>Tap to download</div>
            </span>
          </a>

          <h2 className={styles.noteH}>Get in touch</h2>
          <p className={styles.noteP}>
            <a className={styles.link} href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <br />
            <a className={styles.link} href={tel}>
              {phoneText}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────── About: a contact card in Contacts ───────── */

export function ContactsAbout() {
  const { openApp } = usePhone();
  return (
    <div className={`${styles.screen} ${styles.grouped}`}>
      <Nav label="Contacts" />
      <div className={styles.scroll}>
        <div className={styles.contactTop}>
          <img className={styles.avatar} src="/assets/profile/ken.jpg" alt="Kenneth Nathanael" />
          <div className={styles.contactName}>Kenneth Nathanael</div>
          <div className={styles.contactSub}>Designer · Hyderabad, India</div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={() => openApp({ appKey: 'imessage', label: 'Messages', icon: 'messages' })}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 3C6.5 3 2 6.6 2 11c0 2.5 1.4 4.7 3.6 6.2-.2 1.3-.8 2.5-1.6 3.4 1.9-.1 3.6-.8 4.8-1.6.9.2 1.9.4 3.2.4 5.5 0 10-3.6 10-8.4S17.5 3 12 3z" />
            </svg>
            message
          </button>
          <a className={styles.action} href={tel}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6.6 3h3.2l1.6 4.4-2.1 1.8c1 2.4 2.9 4.3 5.3 5.3l1.8-2.1 4.4 1.6v3.2c0 1.1-.9 2-2 1.9C10.6 18.2 5.8 13.4 4.7 5c-.1-1.1.8-2 1.9-2z" />
            </svg>
            call
          </a>
          <a className={styles.action} href={`mailto:${EMAIL}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5zm2.2.3L12 12.4l6.8-5.6z" />
            </svg>
            mail
          </a>
          <a className={styles.action} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M7 2.5h2V5h6V2.5h2V5h1.5A2.5 2.5 0 0 1 21 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5H7zM5 10v8.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V10z" />
            </svg>
            book
          </a>
        </div>

        <div className={styles.group}>
          <a className={styles.row} href={tel}>
            <span className={styles.rowLabel}>mobile</span>
            <span className={styles.rowValue}>{phoneText}</span>
          </a>
          <a className={styles.row} href={`mailto:${EMAIL}`}>
            <span className={styles.rowLabel}>email</span>
            <span className={styles.rowValue}>{EMAIL}</span>
          </a>
          <a className={styles.row} href={LINKEDIN} target="_blank" rel="noopener noreferrer">
            <span className={styles.rowLabel}>linkedin</span>
            <span className={styles.rowValue}>Kenneth Nathanael</span>
          </a>
          <a className={styles.row} href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            <span className={styles.rowLabel}>instagram</span>
            <span className={styles.rowValue}>@nathanaelkenneth</span>
          </a>
        </div>
        <div className={styles.group}>
          <div className={styles.row} style={{ cursor: 'default' }}>
            <span className={styles.rowLabel}>notes</span>
            <span className={`${styles.rowValue} ${styles.rowValueText}`} style={{ whiteSpace: 'normal' }}>
              10+ years shaping brands, campaigns and interfaces. I start with the idea and stay for the last pixel. Brand identity, motion, video, UI/UX and print, from the first sketch to the file that ships.
            </span>
          </div>
        </div>
        <div className={styles.chips}>
          {['Brand Identity', 'Motion Design', 'UI/UX', 'Print Design', 'Social Media', 'Illustration'].map((s) => (
            <span key={s} className={styles.chip}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Clock: the world clock, truly ───────── */

const ZONES = [
  ['Hyderabad', 'Asia/Kolkata'],
  ['Dubai', 'Asia/Dubai'],
  ['London', 'Europe/London'],
  ['New York', 'America/New_York'],
  ['Los Angeles', 'America/Los_Angeles'],
];

function ClockRow({ city, zone }) {
  const t = useClock((d) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true, weekday: 'short' }).formatToParts(d);
    const get = (k) => parts.find((p) => p.type === k)?.value || '';
    const here = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    return JSON.stringify({ time: `${get('hour')}:${get('minute')}`, ap: get('dayPeriod'), day: get('weekday') === here ? 'Today' : get('weekday') });
  });
  const v = JSON.parse(t);
  return (
    <div className={styles.clockRow}>
      <div>
        <div className={styles.clockCity}>{city}</div>
        <div className={styles.clockDay}>{v.day}</div>
      </div>
      <div className={styles.clockTime}>
        {v.time}
        <span className={styles.clockAmpm}>{v.ap}</span>
      </div>
    </div>
  );
}

export function ClockApp() {
  return (
    <div className={styles.screen}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle}>World Clock</div>
        {ZONES.map(([city, zone]) => (
          <ClockRow key={city} city={city} zone={zone} />
        ))}
      </div>
    </div>
  );
}

/* ───────── Calendar: this month, and a way to book ───────── */

export function CalendarApp() {
  const now = useClock((d) => d.toDateString());
  const d = useMemo(() => new Date(now), [now]);
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ n: prevDays - i, muted: true });
  for (let n = 1; n <= days; n++) cells.push({ n, today: n === d.getDate() });
  while (cells.length % 7) cells.push({ n: cells.length - first - days + 1, muted: true });
  return (
    <div className={styles.screen}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.calHead}>
          <span className={styles.calMonth}>{d.toLocaleDateString('en-US', { month: 'long' })}</span>
          <span className={styles.calYear}>{y}</span>
        </div>
        <div className={styles.calGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((c, i) => (
            <div key={i} className={styles.calDow}>
              {c}
            </div>
          ))}
          {cells.map((c, i) => (
            <div key={i} className={`${styles.calDay} ${c.muted ? styles.calMuted : ''} ${c.today ? styles.calToday : ''}`}>
              {c.today && <i />}
              <span>{c.n}</span>
            </div>
          ))}
        </div>
        <div className={styles.bookCard}>
          <div className={styles.bookTitle}>Talk to Ken</div>
          <div className={styles.bookSub}>Pick a time that suits you. 30 minutes, on a call.</div>
          <a className={styles.primary} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            Book a call
          </a>
        </div>
      </div>
    </div>
  );
}

/* ───────── Tips: how to use this phone ───────── */

export const TIPS = [
  { color: '#0a84ff', glyph: 'up', title: 'Swipe up from the bottom', text: 'In any app, swipe up from the bottom edge to go home. Swipe up and hold to see your recent apps, then flick a card away.' },
  { color: '#30d158', glyph: 'back', title: 'Swipe from the left edge', text: 'Swipe in from the left edge to go back. The browser\'s Back button does the same.' },
  { color: '#ff9f0a', glyph: 'chevronR', title: 'Swipe for more apps', text: 'Swipe left and right on the home screen: there are two pages. Pull down on the home screen to search.' },
  { color: '#bf5af2', glyph: 'sun', title: 'Control Center', text: 'Swipe down from the top right, or tap the signal icons. Switch Light and Dark, and jump back to the story from there.' },
];

export function TipsList() {
  return (
    <div className={styles.tips}>
      {TIPS.map((t) => (
        <div key={t.title} className={styles.tip}>
          <span className={styles.tipIcon} style={{ background: t.color }}>
            <Glyph name={t.glyph} size={22} />
          </span>
          <div>
            <div className={styles.tipTitle}>{t.title}</div>
            <div className={styles.tipText}>{t.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TipsApp() {
  return (
    <div className={`${styles.screen} ${styles.grouped}`}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle}>Tips</div>
        <TipsList />
      </div>
    </div>
  );
}

/* ───────── Link apps: Instagram, LinkedIn, WhatsApp, Maps ───────── */

export function LinkApp({ appKey }) {
  const a = LINK_APPS[appKey];
  const { close } = usePhone();
  if (!a) return null;
  return (
    <div className={styles.screen}>
      <Nav label="Home" />
      <div className={styles.linkWrap}>
        <div className={styles.linkIcon}>
          <AppTile app={a} />
        </div>
        <div className={styles.linkName}>{a.name}</div>
        <div className={styles.linkHandle}>{a.handle}</div>
        <div className={styles.linkLine}>{a.line}</div>
        <div className={styles.linkBtns}>
          <a className={styles.primary} href={a.url} target="_blank" rel="noopener noreferrer">
            {a.cta}
          </a>
          <button type="button" className={styles.secondary} onClick={close}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

/* appKey → the screen. `themed` screens draw their own background and status
   bar from the phone's appearance. */
export const SCREENS = {
  resume: NotesResume,
  reminders: RemindersApp,
  wallet: WalletApp,
  about: ContactsAbout,
  photos: PhotosApp,
  camera: CameraApp,
  safari: SafariApp,
  settings: SettingsApp,
  clock: ClockApp,
  calendar: CalendarApp,
  tips: TipsApp,
  'link-instagram': () => <LinkApp appKey="link-instagram" />,
  'link-linkedin': () => <LinkApp appKey="link-linkedin" />,
  'link-whatsapp': () => <LinkApp appKey="link-whatsapp" />,
  'link-maps': () => <LinkApp appKey="link-maps" />,
  'link-facetime': () => <LinkApp appKey="link-facetime" />,
};
export const DARK_SCREENS = new Set(['camera']);
