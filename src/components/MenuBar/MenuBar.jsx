import { useEffect, useMemo, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { useBattery } from '../../hooks/useBattery.js';
import { useSystemSettings } from '../../hooks/useSystemSettings.js';
import ControlCenter, { ControlCenterGlyph } from './ControlCenter.jsx';
import styles from './MenuBar.module.css';

const APP_LABELS = {
  about: 'About Ken',
  contact: 'Contact',
  finder: 'Work',
  terminal: 'Terminal',
  minesweeper: 'Minesweeper',
  pdfviewer: 'Resume',
  projectviewer: 'Project',
  trash: 'Trash',
  claude: 'Claude, Ask me about Ken',
  systempreferences: 'System Settings',
};

/** The battery, the visitor's own where the browser shares it: drawn like
 *  macOS's own (percentage first, an outline with a white fill that turns
 *  red when low, a bolt inside while charging). */
function BatteryIcon() {
  const { level, charging } = useBattery();
  const pct = Math.round(level * 100);
  const low = pct <= 20 && !charging;
  const fill = Math.max(1.5, (pct / 100) * 19);
  return (
    <span className={styles.battery} title={`Battery ${pct}%${charging ? ', charging' : ''}`} aria-hidden>
      <span className={styles.batteryPct}>{pct}%</span>
      <svg className={styles.batteryGlyph} viewBox="0 0 27 13">
        <rect x="0.6" y="0.6" width="23.3" height="11.8" rx="3.4" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M25.3 4.4v4.2c.9-.3 1.4-1.1 1.4-2.1s-.5-1.8-1.4-2.1z" fill="currentColor" fillOpacity="0.45" />
        <rect x="2.25" y="2.25" width={fill} height="8.5" rx="1.9" fill={low ? '#ff453a' : 'currentColor'} />
        {charging && <path d="M13.4 1.6 8.6 7.3h3.3l-1.2 4.1 4.8-5.7h-3.3z" className={styles.bolt} />}
      </svg>
    </span>
  );
}

/** Wi-Fi, as macOS draws it: three arcs over a dot, a fan. */
function WifiGlyph() {
  return (
    <svg className={styles.wifiGlyph} viewBox="0 0 17 12.5" aria-hidden>
      <path fill="currentColor" d="M8.5 0C5.3 0 2.4 1.2.2 3.3c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0C3.6 3.2 6 2.2 8.5 2.2s4.9 1 6.7 2.7c.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7C14.6 1.2 11.7 0 8.5 0z" />
      <path fill="currentColor" d="M8.5 4.1c-2 0-3.8.8-5.2 2-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0 1-.9 2.2-1.4 3.6-1.4s2.6.5 3.6 1.4c.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7-1.4-1.2-3.2-2-5.2-2z" />
      <path fill="currentColor" d="M8.5 8.2c-.9 0-1.7.3-2.3.9-.2.2-.2.5 0 .7l1.9 1.9c.2.2.5.2.7 0l1.9-1.9c.2-.2.2-.5 0-.7-.5-.6-1.3-.9-2.2-.9z" />
    </svg>
  );
}

/** Achievements: a trophy in the menu bar's own line weight, not an emoji. */
function TrophyGlyph() {
  return (
    <svg className={styles.trophyGlyph} viewBox="0 0 16 15" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M4.3 1h7.4v4.2a3.7 3.7 0 0 1-7.4 0zM4.3 2.4H1.6v1.1A2.8 2.8 0 0 0 4.5 6.3M11.7 2.4h2.7v1.1a2.8 2.8 0 0 1-2.9 2.8M8 8.9v2.6M5.2 14h5.6M6.1 14l.5-2.5h2.8l.5 2.5"
      />
    </svg>
  );
}

export default function MenuBar({ onOpenAchievements, onShutDown, onWorkWithMe }) {
  const { windows, activeWindowId, launchApp } = useOS();
  const [now, setNow] = useState(() => new Date());
  const [appleOpen, setAppleOpen] = useState(false);
  const appleRef = useRef(null);
  const [ccOpen, setCcOpen] = useState(false);
  const ccRef = useRef(null);
  const sys = useSystemSettings();

  useEffect(() => {
    if (!appleOpen) return undefined;
    const onDown = (e) => {
      if (!appleRef.current?.contains(e.target)) setAppleOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setAppleOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [appleOpen]);

  const runApple = (fn) => () => {
    setAppleOpen(false);
    fn?.();
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeAppName = useMemo(() => {
    if (!activeWindowId) return 'Desktop';
    const win = windows.find((w) => w.id === activeWindowId && !w.minimized);
    if (!win) return 'Desktop';
    if (win.appId === 'projectviewer' && win.title) return win.title;
    return APP_LABELS[win.appId] || win.title || 'Desktop';
  }, [windows, activeWindowId]);

  const dateTime = formatMacDateTime(now);

  return (
    <header className={styles.menuBar}>
      <div className={styles.left}>
        <div className={styles.appleWrap} ref={appleRef}>
          <button
            type="button"
            className={`${styles.logo} ${appleOpen ? styles.logoActive : ''}`}
            aria-label="Apple menu"
            data-tour="menu-apple"
            aria-haspopup="menu"
            aria-expanded={appleOpen}
            onClick={() => setAppleOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>
          {appleOpen && (
            <div className={styles.appleMenu} role="menu">
              <button type="button" role="menuitem" onClick={runApple(() => launchApp('about'))}>
                About This Mac
              </button>
              <div className={styles.sep} />
              <button type="button" role="menuitem" onClick={runApple(() => launchApp('systempreferences'))}>
                System Settings…
              </button>
              {onShutDown && <div className={styles.sep} />}
              {onShutDown && (
                <button type="button" role="menuitem" onClick={runApple(onShutDown)}>
                  Shut Down…
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={styles.center}>{activeAppName}</div>
      <div className={styles.right}>
        {/* The same brief as on the way in: what can Ken design for you? */}
        {onWorkWithMe && (
          <button type="button" className={styles.hire} onClick={onWorkWithMe}>
            <i aria-hidden />
            Work with me
          </button>
        )}
        <span className={`${styles.wifi} ${sys.wifi ? '' : styles.wifiOff}`} title={sys.wifi ? 'Wi-Fi' : 'Wi-Fi: Off'} aria-hidden>
          <WifiGlyph />
        </span>
        <BatteryIcon />
        {onOpenAchievements && (
          <button
            type="button"
            className={styles.trophy}
            onClick={onOpenAchievements}
            aria-label="Achievements"
            data-tour="menu-achievements"
          >
            <TrophyGlyph />
          </button>
        )}
        <button
          ref={ccRef}
          type="button"
          className={`${styles.ccButton} ${ccOpen ? styles.ccButtonOn : ''}`}
          aria-label="Control Center"
          aria-expanded={ccOpen}
          onClick={() => setCcOpen((o) => !o)}
        >
          <ControlCenterGlyph />
        </button>
        <time className={styles.dateTime} dateTime={now.toISOString()}>
          {dateTime}
        </time>
      </div>
      <ControlCenter open={ccOpen} onClose={() => setCcOpen(false)} anchorRef={ccRef} />
    </header>
  );
}

function formatMacDateTime(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${weekday} ${month} ${day}  ${hours}:${minutes} ${ampm}`;
}
