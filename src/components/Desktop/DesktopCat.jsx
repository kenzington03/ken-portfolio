import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './DesktopCat.module.css';

const QUIPS = ['nice portfolio', 'pet me', 'open terminal', 'meow', 'hire ken', 'pspsps'];

const MEOW_SRC = 'https://actions.google.com/sounds/v1/animals/cat_meow.ogg';

const CAT_FRAMES = [
  ` /\\_/\\
( o.o )
 > ^ <`,
  ` /\\_/\\
( -.- )
 > ^ ~`,
];

export default function DesktopCat() {
  const [x, setX] = useState(16);
  const [frame, setFrame] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [quip, setQuip] = useState(null);
  const walkRef = useRef(null);

  useEffect(() => {
    const tail = setInterval(() => setFrame((f) => (f + 1) % 2), 2000);
    return () => clearInterval(tail);
  }, []);

  useEffect(() => {
    const scheduleWalk = () => {
      const delay = 30000 + Math.random() * 30000;
      walkRef.current = setTimeout(() => {
        const delta = Math.random() > 0.5 ? 12 : -12;
        setX((prev) => Math.max(8, Math.min(prev + delta, 120)));
        scheduleWalk();
      }, delay);
    };
    scheduleWalk();
    return () => {
      if (walkRef.current) clearTimeout(walkRef.current);
    };
  }, []);

  const onClick = useCallback(() => {
    setJumping(true);
    setTimeout(() => setJumping(false), 400);
    const audio = new Audio(MEOW_SRC);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  const onEnter = () => {
    setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  };

  const onLeave = () => setQuip(null);

  return (
    <div
      className={`${styles.catWrap} ${jumping ? styles.jumping : ''}`}
      style={{ left: x }}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="button"
      tabIndex={0}
      aria-label="Desktop cat"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      {quip && <span className={styles.bubble}>{quip}</span>}
      <pre className={styles.cat} aria-hidden>
        {CAT_FRAMES[frame]}
      </pre>
    </div>
  );
}
