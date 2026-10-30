import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Screensaver.module.css';

const IDLE_MS = 90000;
// The classic bouncing logo, with Ken's name. Every wall hit changes the
// colour; landing exactly in a corner is the jackpot.
const COLORS = ['#ff4f1a', '#3d7bff', '#ff3d8b', '#ffb224', '#30d158', '#bf5af2', '#64d2ff'];
const SPEED = 190; // px per second
const CORNER_SLOP = 14; // how close to both walls counts as a corner

function Bouncer({ reduced }) {
  const ref = useRef(null);
  const [color, setColor] = useState(0);
  const [hits, setHits] = useState({ walls: 0, corners: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return undefined;
    let x = Math.random() * (window.innerWidth - el.offsetWidth);
    let y = Math.random() * (window.innerHeight - el.offsetHeight);
    let vx = Math.random() < 0.5 ? SPEED : -SPEED;
    let vy = Math.random() < 0.5 ? SPEED * 0.82 : -SPEED * 0.82;
    let last = performance.now();
    let raf = 0;
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      x += vx * dt;
      y += vy * dt;
      let hitX = false;
      let hitY = false;
      if (x <= 0 || x >= maxX) {
        x = Math.max(0, Math.min(maxX, x));
        vx = -vx;
        hitX = true;
      }
      if (y <= 0 || y >= maxY) {
        y = Math.max(0, Math.min(maxY, y));
        vy = -vy;
        hitY = true;
      }
      if (hitX || hitY) {
        const nearX = Math.min(x, maxX - x) < CORNER_SLOP;
        const nearY = Math.min(y, maxY - y) < CORNER_SLOP;
        const corner = nearX && nearY;
        setColor((c) => (c + 1) % COLORS.length);
        setHits((h) => ({ walls: h.walls + 1, corners: h.corners + (corner ? 1 : 0) }));
        if (corner) {
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { x: (x + el.offsetWidth / 2) / window.innerWidth, y: (y + el.offsetHeight / 2) / window.innerHeight },
            zIndex: 100001,
          });
        }
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <>
      <div ref={ref} className={`${styles.bouncer} ${reduced ? styles.bouncerStill : ''}`} style={{ color: COLORS[color] }}>
        <span className={styles.bouncerName}>Ken</span>
        <span className={styles.bouncerTag}>Designer</span>
      </div>
      <p className={styles.score}>
        Wall hits <b>{hits.walls}</b>
        <span />
        Corner hits <b>{hits.corners}</b>
      </p>
    </>
  );
}

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

    // Reading counts as being here: a trackpad scroll inside a window moves
    // no mouse and scrolls no page, so wheel and scroll are caught at capture.
    const events = ['pointerdown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { capture: true, passive: true }));
    resetIdle();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle, { capture: true }));
    };
  }, [screensaverActive, setScreensaverActive, unlock]);

  useEffect(() => {
    if (!screensaverActive) return;
    const id = setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, [screensaverActive]);

  const dismiss = () => setScreensaverActive(false);

  // Any sign of life wakes it, keys and scrolls included (the overlay itself
  // never has focus, so they are heard on the window).
  useEffect(() => {
    if (!screensaverActive) return;
    const wake = () => setScreensaverActive(false);
    const events = ['keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, wake));
  }, [screensaverActive, setScreensaverActive]);

  if (!screensaverActive) return null;

  return (
    <div
      className={styles.screensaver}
      onMouseMove={dismiss}
      onClick={dismiss}
      role="presentation"
    >
      <Bouncer reduced={window.matchMedia?.('(prefers-reduced-motion: reduce)').matches} />
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
