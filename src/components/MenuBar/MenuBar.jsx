import { useEffect, useMemo, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
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
  claude: 'Claude — Ask me about Ken',
  systempreferences: 'System Preferences',
};

export default function MenuBar({ onOpenAchievements }) {
  const { windows, activeWindowId } = useOS();
  const [now, setNow] = useState(() => new Date());

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
        <button type="button" className={styles.logo} aria-label="KN Menu">
          KN
        </button>
      </div>
      <div className={styles.center}>{activeAppName}</div>
      <div className={styles.right}>
        <span className={styles.wifi} title="Wi-Fi" aria-hidden>
          <span className={styles.wifiBar} />
          <span className={styles.wifiBar} />
          <span className={styles.wifiBar} />
        </span>
        <span className={styles.battery} title="Battery" aria-hidden>
          <span className={styles.batteryBody}>
            <span className={styles.batteryFill} />
          </span>
          <span className={styles.batteryCap} />
          <span className={styles.batteryPct}>100%</span>
        </span>
        {onOpenAchievements && (
          <button
            type="button"
            className={styles.trophy}
            onClick={onOpenAchievements}
            aria-label="Achievements"
          >
            🏆
          </button>
        )}
        <time className={styles.dateTime} dateTime={now.toISOString()}>
          {dateTime}
        </time>
      </div>
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
