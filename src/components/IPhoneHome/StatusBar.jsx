import { useEffect, useState } from 'react';
import styles from './StatusBar.module.css';

function SignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
      <rect x="0" y="7" width="3" height="5" rx="0.8" fill="white" opacity="1"/>
      <rect x="4.5" y="5" width="3" height="7" rx="0.8" fill="white" opacity="1"/>
      <rect x="9" y="2.5" width="3" height="9.5" rx="0.8" fill="white" opacity="1"/>
      <rect x="13.5" y="0" width="3" height="12" rx="0.8" fill="white" opacity="1"/>
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="white"/>
      <path d="M3.2 6.4a6.7 6.7 0 0 1 9.6 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M0.5 3.5a10.5 10.5 0 0 1 15 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="20" height="11" rx="3.5" stroke="white" strokeOpacity="0.35" strokeWidth="1"/>
      <rect x="1.5" y="1.5" width="17" height="9" rx="2.5" fill="white"/>
      <path d="M21.5 4v4a2 2 0 0 0 0-4z" fill="white" opacity="0.4"/>
    </svg>
  );
}

function formatTime(date) {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m}`;
}

export default function StatusBar() {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const update = () => setTime(formatTime(new Date()));
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.statusBar}>
      <span className={styles.time}>{time}</span>
      <div className={styles.right}>
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}
