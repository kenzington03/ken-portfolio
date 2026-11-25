import { useState } from 'react';
import StatusBar from './StatusBar.jsx';
import useClock from '../../hooks/useClock.js';
import { ICON, NOTIFICATIONS } from './apps.js';
import { Glyph } from './icons.jsx';
import styles from './ios26.module.css';

/* Lock screen, Figma "Examples/Lock Screen" + "Examples/Notifications".
   Date line y=82, clock y=115, widgets y=214, controls 50px from the bottom.
   The kit's weather is placeholder, so the widgets say true things about Ken
   instead (name, role, years, and today's date). */

const hm = (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
const hmAmPm = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const inlineDate = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const longDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const dayNum = (d) => d.getDate();
const daysIn = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/* flashlight.off.fill: wide head, narrow neck, body with a button slot. */
const Flashlight = () => (
  <svg width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden>
    <path d="M1.2 1.5A1.5 1.5 0 0 1 2.7 0h10.6a1.5 1.5 0 0 1 1.5 1.5v3.3a1.5 1.5 0 0 1-.5 1.1L11.6 8.4H4.4L1.7 5.9a1.5 1.5 0 0 1-.5-1.1z" fill="currentColor" />
    <path d="M4.4 9.9h7.2V23a3 3 0 0 1-3 3H7.4a3 3 0 0 1-3-3z" fill="currentColor" />
    <rect x="6.9" y="13" width="2.2" height="4.6" rx="1.1" fill="#000" fillOpacity="0.55" />
  </svg>
);
const CameraGlyph = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden>
    <path d="M9.4 1.5h9.2l1.7 3H24A3.5 3.5 0 0 1 27.5 8v10A3.5 3.5 0 0 1 24 21.5H4A3.5 3.5 0 0 1 .5 18V8A3.5 3.5 0 0 1 4 4.5h3.7z" fill="currentColor" />
    <circle cx="14" cy="13" r="4.6" fill="#000" fillOpacity="0.5" />
  </svg>
);
const Globe = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden style={{ verticalAlign: -3, margin: '0 3px' }}>
    <circle cx="9.5" cy="9.5" r="8" stroke="#fff" strokeWidth="1.7" />
    <path d="M1.8 9.5h15.4M9.5 1.5c2.5 2.2 3.7 4.9 3.7 8s-1.2 5.8-3.7 8c-2.5-2.2-3.7-4.9-3.7-8s1.2-5.8 3.7-8z" stroke="#fff" strokeWidth="1.5" />
  </svg>
);

function Gauge({ value, lo, hi }) {
  // Open gauge: 270° arc, a dot at the current value.
  const r = 25;
  const c = 29;
  const a0 = 135;
  const sweep = 270;
  const pt = (deg) => [c + r * Math.cos((deg * Math.PI) / 180), c + r * Math.sin((deg * Math.PI) / 180)];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a0 + sweep);
  const t = Math.min(1, Math.max(0, (value - lo) / (hi - lo)));
  const [dx, dy] = pt(a0 + sweep * t);
  return (
    <div className={styles.wGauge}>
      <svg width="58" height="58" viewBox="0 0 58 58" fill="none" aria-hidden>
        <path d={`M${x0} ${y0} A${r} ${r} 0 1 1 ${x1} ${y1}`} stroke="#fff" strokeOpacity="0.4" strokeWidth="5" strokeLinecap="round" />
        <circle cx={dx} cy={dy} r="3.2" fill="#fff" />
      </svg>
      <div className={styles.wGaugeVal}>{value}</div>
      <span className={styles.wGaugeLo}>{lo}</span>
      <span className={styles.wGaugeHi}>{hi}</span>
    </div>
  );
}

export default function LockScreen({
  kit = false, // the kit's placeholder content, for checking against Figma
  time: timeProp,
  showNotifications = false,
  dark = false,
  unlocked = false,
  dragY = 0,
  onNotifTap,
  onStatusTap,
}) {
  const t = useClock(hm);
  const dInline = useClock(inlineDate);
  const dLong = useClock(longDate);
  const tAmPm = useClock(hmAmPm);
  const dDay = useClock(dayNum);
  const dMonthLen = useClock(daysIn);
  const [torch, setTorch] = useState(false);

  const time = timeProp ?? (kit ? '9:41' : t);
  const dragging = dragY !== 0;
  const front = NOTIFICATIONS.filter((n) => !n.stack);
  const stacked = NOTIFICATIONS.find((n) => n.stack);

  return (
    <div
      className={`${styles.lock} ${showNotifications ? styles.lockNotifs : ''}`}
      style={
        unlocked
          ? { transform: 'translateY(-100%)', opacity: 0, pointerEvents: 'none' }
          : dragging
            ? { transform: `translateY(${dragY}px)`, transition: 'none' }
            : undefined
      }
    >
      {/* The lock layer is its own stacking context, so the plus-lighter
          widgets need a wallpaper inside it to blend with. The wallpaper stays
          still while the lock slides: counter-translate it by exactly what the
          lock moves, on the same curve. */}
      <img
        className={`${styles.wallpaper} ${dark ? styles.wallpaperDark : ''}`}
        src="/assets/ios26/chrome/wallpaper.jpg"
        alt=""
        draggable={false}
        style={{
          transform: unlocked ? 'translateY(100%)' : dragging ? `translateY(${-dragY}px)` : 'translateY(0)',
          transition: dragging ? 'filter 400ms ease' : 'filter 400ms ease, transform 520ms cubic-bezier(0.32, 0.72, 0, 1)',
          // Once the lock moves, this copy would hide the home screen under it.
          // The home wallpaper is the same image in the same place, so dropping
          // this one changes nothing visible except letting the icons show.
          opacity: dragging || unlocked ? 0 : 1,
        }}
      />
      <div className={styles.lockScrim} />
      <StatusBar time={kit ? '9:41' : undefined} onTap={onStatusTap} />
      <div className={styles.swipeHint} />

      <div className={styles.lockInline}>
        {kit ? 'Apr 1' : dInline} <Globe /> {kit ? 'SFO 9:41 AM' : tAmPm}
      </div>
      <div className={styles.lockDate}>{kit ? 'Monday, June 6' : dLong}</div>
      <div className={styles.lockClock}>{time}</div>

      <div className={styles.lockWidgets}>
        <div className={styles.wTable}>
          <div className={styles.wTableHead}>
            {kit ? <Glyph name="sun" size={17} /> : <Glyph name="heart" size={15} />}
            <span>{kit ? '72º' : 'Ken'}</span>
          </div>
          <div className={styles.wTableRow}>{kit ? 'Partly Cloudy' : 'Designer'}</div>
          <div className={styles.wTableRow}>{kit ? 'H:88º L:64º' : '10+ years'}</div>
        </div>
        <div className={styles.wRight}>
          <div className={styles.wCircle}>{kit ? <Gauge value={67} lo={50} hi={78} /> : <Gauge value={dDay} lo={1} hi={dMonthLen} />}</div>
          <div className={styles.wCircle}>
            <div className={styles.wStack}>
              <span>{kit ? '8:29' : '10+'}</span>
              <small>{kit ? 'PM' : 'YRS'}</small>
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className={styles.notifs}>
          {front.map((n, i) => (
            <div
              key={n.id}
              className={`${styles.notif} ${styles.glass} ${styles.glassBlur} ${styles.notifIn}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => onNotifTap?.(n)}
            >
              <img className={styles.notifIcon} src={ICON(n.icon)} alt="" />
              <div className={styles.notifText}>
                <div className={styles.notifTitle}>{n.title}</div>
                <div className={styles.notifDesc}>{n.body}</div>
              </div>
              <div className={styles.notifTime}>{n.time}</div>
            </div>
          ))}
          {stacked && (
            <div className={`${styles.notif} ${styles.notifStack} ${styles.notifIn}`} style={{ animationDelay: '210ms' }} onClick={() => onNotifTap?.(stacked)}>
              <div className={`${styles.peek} ${styles.peek2} ${styles.glass} ${styles.glassBlur}`} />
              <div className={`${styles.peek} ${styles.peek1} ${styles.glass} ${styles.glassBlur}`} />
              <div className={`${styles.glass} ${styles.glassBlur}`} style={{ position: 'absolute', inset: '0 0 14.33px 0', borderRadius: 24 }} />
              <img className={styles.notifIcon} src={ICON(stacked.icon)} alt="" style={{ position: 'relative' }} />
              <div className={styles.notifText} style={{ position: 'relative' }}>
                <div className={styles.notifTitle}>{stacked.title}</div>
                <div className={styles.notifDesc}>{stacked.body}</div>
              </div>
              <div className={styles.notifTime} style={{ position: 'relative' }}>
                {stacked.time}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.lockControls}>
        <button
          type="button"
          className={`${styles.lockBtn} ${styles.glass} ${styles.glassBlur} ${torch ? styles.lockBtnOn : ''}`}
          aria-label="Flashlight"
          aria-pressed={torch}
          onClick={() => setTorch((v) => !v)}
        >
          <Flashlight />
        </button>
        <button type="button" className={`${styles.lockBtn} ${styles.glass} ${styles.glassBlur}`} aria-label="Camera">
          <CameraGlyph />
        </button>
      </div>
    </div>
  );
}
