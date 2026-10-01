// "Kenneth Nathanael" as a kinetic wordmark.
// - "Ken" is solid; every other letter is an outline that fills in (and
//   lifts a touch) as the pointer comes near, so the nickname is always
//   legible and the full name reveals itself under the cursor.
// - Entrance: letters flip up like a split-flap board (the Mac "boots").
// - Click any letter: a squash-and-stretch hop ripples out to its
//   neighbours (WAAPI, so it runs off the React tree and is interruptible).
// - No pointer (touch) or idle: a slow fill sweep runs through the name.
// All per-frame work writes styles directly; React renders the markup once.

import { useEffect, useRef } from 'react';
import styles from './hero.module.css';

const LINES = ['Kenneth', 'Nathanael'];
const SOLID = 3; // first three letters of line one: "Ken"
const IDLE_SWEEP_EVERY = 6500;
const SWEEP_MS = 1600;

const smooth = (t) => t * t * (3 - 2 * t);

export default function HeroName({ reduced }) {
  const rootRef = useRef(null);
  const letters = useRef([]);

  useEffect(() => {
    const els = letters.current.filter(Boolean);
    if (reduced || !els.length) return undefined;

    const pointer = { x: 0, y: 0, live: false, last: 0 };
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.live = true;
      pointer.last = performance.now();
    };
    const onLeave = () => {
      pointer.live = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    const fill = els.map((el) => (el.dataset.solid ? 1 : 0));
    const lift = els.map(() => 0);
    let sweepAt = performance.now() + 1400; // first sweep right after the entrance
    let last = performance.now();
    let raf = 0;
    let settled = false;
    const hero = rootRef.current?.closest('[data-hero]');

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const root = rootRef.current;
      if (!root || hero?.style.visibility === 'hidden') return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const idle = !pointer.live || now - pointer.last > 2500;
      if (idle && now - sweepAt > SWEEP_MS + IDLE_SWEEP_EVERY) sweepAt = now;
      const sk = (now - sweepAt) / SWEEP_MS;
      // Idle, between sweeps, and every letter at rest: nothing to read or write.
      if (idle && (sk < 0 || sk > 1) && settled) return;

      const box = root.getBoundingClientRect();
      const radius = box.height * 0.75;
      const sweepX = sk >= 0 && sk <= 1 ? box.left - radius + (box.width + 2 * radius) * sk : null;

      // Read every rect first, then write, so the loop never forces layout.
      const rects = els.map((el) => el.getBoundingClientRect());
      const k = 1 - Math.exp(-dt * 9);
      let moving = 0;
      rects.forEach((r, i) => {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let inf = 0;
        if (!idle) inf = smooth(Math.max(0, 1 - Math.hypot(pointer.x - cx, pointer.y - cy) / radius));
        if (sweepX !== null) inf = Math.max(inf, smooth(Math.max(0, 1 - Math.abs(sweepX - cx) / (radius * 0.8))));
        const target = els[i].dataset.solid ? 1 : inf;
        fill[i] += (target - fill[i]) * k;
        lift[i] += (inf - lift[i]) * k;
        moving = Math.max(moving, Math.abs(target - fill[i]), Math.abs(inf - lift[i]));
      });
      settled = moving < 0.002;
      els.forEach((el, i) => {
        const f = fill[i];
        el.style.color = `rgba(244, 244, 245, ${f.toFixed(3)})`;
        el.style.webkitTextStrokeColor = `rgba(244, 244, 245, ${(0.42 + 0.58 * f).toFixed(3)})`;
        el.style.translate = `0 ${(-lift[i] * 0.05).toFixed(4)}em`;
      });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  const hop = (index) => {
    if (reduced) return;
    const els = letters.current.filter(Boolean);
    const origin = els[index]?.getBoundingClientRect();
    if (!origin) return;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(r.left - origin.left, (r.top - origin.top) * 1.4);
      const reach = Math.max(0, 1 - d / (origin.width * 7));
      if (reach <= 0) return;
      el.animate(
        [
          { transform: 'translateY(0) scale(1, 1)' },
          { transform: 'translateY(0) scale(1.12, 0.84)', offset: 0.14 },
          { transform: `translateY(${-0.26 * reach}em) scale(0.94, 1.1)`, offset: 0.42 },
          { transform: 'translateY(0) scale(1.08, 0.9)', offset: 0.72 },
          { transform: 'translateY(0) scale(1, 1)' },
        ],
        { duration: 620, delay: (d / origin.width) * 45, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    });
  };

  let n = 0;
  return (
    <h1 ref={rootRef} className={styles.name} aria-label="Kenneth Nathanael">
      {LINES.map((line, li) => (
        <span key={line} className={styles.nameLine} aria-hidden>
          {Array.from(line).map((ch, ci) => {
            const i = n++;
            const solid = li === 0 && ci < SOLID;
            return (
              <span
                key={i}
                ref={(el) => {
                  letters.current[i] = el;
                }}
                data-solid={solid ? '1' : undefined}
                className={`${styles.letter} ${solid ? styles.solid : ''}`}
                style={reduced ? undefined : { animationDelay: `${120 + i * 38}ms` }}
                onPointerDown={() => hop(i)}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
