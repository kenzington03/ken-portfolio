import { useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Screensaver.module.css';

const IDLE_MS = 90000;

export default function Screensaver() {
  const { screensaverActive, setScreensaverActive, unlock } = useOS();
  const [time, setTime] = useState(() => formatClock(new Date()));

  useEffect(() => {
    let idleTimer;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      if (screensaverActive) return;
      idleTimer = setTimeout(() => {
        setScreensaverActive(true);
        unlock('screensaver');
      }, IDLE_MS);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetIdle));
    resetIdle();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [screensaverActive, setScreensaverActive, unlock]);

  useEffect(() => {
    if (!screensaverActive) return;
    const id = setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, [screensaverActive]);

  const dismiss = () => setScreensaverActive(false);

  if (!screensaverActive) return null;

  return (
    <div
      className={styles.screensaver}
      onMouseMove={dismiss}
      onClick={dismiss}
      onKeyDown={dismiss}
      role="presentation"
    >
      <div className={styles.orb} />
      <div className={styles.orb} />
      <div className={styles.orb} />
      <div className={styles.clock}>{time}</div>
      <p className={styles.hint}>Move mouse or press a key to wake</p>
    </div>
  );
}

function formatClock(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
