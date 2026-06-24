import { useEffect, useState } from 'react';
import styles from './StatusBar.module.css';

function getTime12h() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m}`;
}

const SignalIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
    <rect x="0" y="8" width="3" height="4" rx="0.8" fill="white"/>
    <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.8" fill="white"/>
    <rect x="9" y="3" width="3" height="9" rx="0.8" fill="white"/>
    <rect x="13.5" y="0.5" width="3" height="11.5" rx="0.8" fill="white"/>
  </svg>
);

const WifiIcon = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
    <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="white"/>
    <path d="M4.1 7.6a5.6 5.6 0 017.8 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M1.5 5a9 9 0 0113 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M0 2.6A12.4 12.4 0 0116 2.6" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.5"/>
  </svg>
);

const BatteryIcon = () => (
  <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
    <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.4"/>
    <rect x="1.5" y="1.5" width="17" height="9" rx="2.2" fill="white"/>
    <path d="M23 4v4a2 2 0 000-4z" fill="white" fillOpacity="0.4"/>
  </svg>
);

export default function StatusBar() {
  const [time, setTime] = useState(getTime12h);

  useEffect(() => {
    const id = setInterval(() => setTime(getTime12h()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.bar}>
      <span className={styles.time}>{time}</span>
      <div className={styles.icons}>
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}
