import { useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { readPalette } from '../Journey/C/palette.js';
import styles from './Screensaver.module.css';

const IDLE_MS = 90000;
const DISPLAY = "'Big Shoulders', 'Cabinet Grotesk', sans-serif";

// Two screensavers, picked with ?saver=print or ?saver=particles (remembered
// on that browser); ?saver-now shows it at once, to try it.
//   print      the bouncing logo, as a print run: Ken's name bounces and
//              leaves an ink stamp, two inks a hair off, at every wall it
//              hits, so a poster builds up behind it as it goes. Landing in
//              a corner slams a stamp of its own into that corner.
//   particles  the time, written in a few thousand points of light that
//              flow apart and gather into Ken's name, then what he does,
//              then the time again.
const SAVERS = ['particles', 'print'];
const SAVER_KEY = 'ken:saver';
const pickSaver = () => {
  try {
    const q = new URLSearchParams(window.location.search).get('saver');
    if (q && SAVERS.includes(q)) {
      localStorage.setItem(SAVER_KEY, q);
      return q;
    }
    const kept = localStorage.getItem(SAVER_KEY);
    return SAVERS.includes(kept) ? kept : SAVERS[0];
  } catch {
    return SAVERS[0];
  }
};
const showNow = () => /[?&]saver-now\b/.test(window.location.search);

const formatClock = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

/** A full-screen canvas at the screen's own pixel density. */
function useCanvas(draw, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);
    const stop = draw(ctx, () => [window.innerWidth, window.innerHeight]);
    return () => {
      stop?.();
      window.removeEventListener('resize', size);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Print run                                                           */
/* ------------------------------------------------------------------ */

// Ink pairs for the stamps: each wall hit takes the next.
const INKS = [
  ['#ff4f1a', '#16234a'],
  ['#2a4bff', '#ff5a36'],
  ['#ff3e8e', '#ffc21a'],
  ['#0fbf86', '#8a4dff'],
  ['#ffc21a', '#ff3e8e'],
];
const SPEED = 170; // px per second
const CORNER_SLOP = 16; // how close to both walls counts as a corner

function PrintRun({ reduced }) {
  const markRef = useRef(null);
  const [hits, setHits] = useState({ walls: 0, corners: 0 });
  const canvasRef = useCanvas((ctx, view) => {
    const el = markRef.current;
    if (!el) return undefined;
    let [W, H] = view();
    const stamp = (x, y, w, h, ink, text = 'KEN', size = h, turn = 0) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(turn);
      ctx.font = `900 ${size}px ${DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Two inks, a hair off each other, like a riso pass.
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = ink[1];
      ctx.fillText(text, size * 0.035, size * 0.035);
      ctx.fillStyle = ink[0];
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };
    if (reduced) return undefined;
    let x = Math.random() * (W - el.offsetWidth);
    let y = Math.random() * (H - el.offsetHeight);
    let vx = Math.random() < 0.5 ? SPEED : -SPEED;
    let vy = Math.random() < 0.5 ? SPEED * 0.8 : -SPEED * 0.8;
    let ink = 0;
    let last = performance.now();
    let raf = 0;
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      [W, H] = view();
      // The paper slowly takes the old prints back.
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.012;
      ctx.fillStyle = '#efece4';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const maxX = W - w;
      const maxY = H - h;
      x += vx * dt;
      y += vy * dt;
      let hit = false;
      if (x <= 0 || x >= maxX) {
        x = Math.max(0, Math.min(maxX, x));
        vx = -vx;
        hit = true;
      }
      if (y <= 0 || y >= maxY) {
        y = Math.max(0, Math.min(maxY, y));
        vy = -vy;
        hit = true;
      }
      if (hit) {
        const corner = Math.min(x, maxX - x) < CORNER_SLOP && Math.min(y, maxY - y) < CORNER_SLOP;
        ink = (ink + 1) % INKS.length;
        el.style.setProperty('--ink-a', INKS[ink][0]);
        el.style.setProperty('--ink-b', INKS[ink][1]);
        stamp(x, y, w, h * 0.92, INKS[ink], 'KEN', h * 0.92);
        if (corner) {
          // The jackpot: a big stamp of its own, slammed into the corner.
          const size = Math.min(W, H) * 0.3;
          const cx = x < W / 2 ? size * 0.2 : W - size * 2.4;
          const cy = y < H / 2 ? size * 0.15 : H - size * 1.15;
          stamp(cx, cy, size * 2.2, size, INKS[(ink + 2) % INKS.length], 'CORNER.', size, x < W / 2 === y < H / 2 ? -0.08 : 0.08);
          el.classList.remove(styles.slam);
          void el.offsetWidth;
          el.classList.add(styles.slam);
        }
        setHits((s) => ({ walls: s.walls + 1, corners: s.corners + (corner ? 1 : 0) }));
      }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    // A fresh sheet.
    ctx.fillStyle = '#efece4';
    ctx.fillRect(0, 0, W, H);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div className={styles.print}>
      <canvas ref={canvasRef} className={styles.sheet} />
      <span className={styles.grain} />
      <div ref={markRef} className={`${styles.mark} ${reduced ? styles.markStill : ''}`}>
        KEN
      </div>
      <p className={styles.score}>
        Prints <b>{hits.walls}</b>
        <span />
        Corners <b>{hits.corners}</b>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Particles                                                           */
/* ------------------------------------------------------------------ */

const HOLD_MS = 6500; // each word holds this long before it flows on

/** Points where `text` is drawn, filling the screen's middle. */
function targetsFor(text, W, H, gap) {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const c = off.getContext('2d');
  let size = Math.min(H * 0.42, (W * 0.84) / (text.length * 0.5));
  c.font = `900 ${size}px ${DISPLAY}`;
  const wide = c.measureText(text).width;
  if (wide > W * 0.86) size *= (W * 0.86) / wide;
  c.font = `900 ${size}px ${DISPLAY}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#fff';
  c.fillText(text, W / 2, H * 0.47);
  const data = c.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += gap) {
    for (let x = 0; x < W; x += gap) {
      // A little off the grid, so it reads as light, not as a dot matrix.
      if (data[(y * W + x) * 4 + 3] > 140) pts.push([x + (Math.random() - 0.5) * gap, y + (Math.random() - 0.5) * gap]);
    }
  }
  return pts;
}

function Particles({ reduced }) {
  const palette = readPalette();
  const canvasRef = useCanvas((ctx, view) => {
    let [W, H] = view();
    const gap = Math.max(4, Math.round(Math.sqrt((W * H) / 30000)));
    const words = () => [formatClock(new Date()), 'KEN', 'DESIGNER'];
    let wi = 0;
    let targets = targetsFor(words()[0], W, H, gap);
    const N = Math.min(7000, Math.round(targets.length * 1.2));
    const ps = Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, t: null, s: 1.1 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2 }));
    const assign = () => {
      // Shuffle who goes where, so every change is a real flow across.
      const order = targets.map((_, i) => i).sort(() => Math.random() - 0.5);
      ps.forEach((p, i) => {
        p.t = i < order.length ? targets[order[i]] : null;
      });
    };
    assign();
    // The poster's ink into warm white, in steps (cheap to pick per point).
    const RAMP = 24;
    const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const [a, b] = [hex(palette.pop), hex('#fff1e2')];
    const ramp = Array.from({ length: RAMP }, (_, i) => {
      const k = i / (RAMP - 1);
      return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`;
    });
    let next = performance.now() + HOLD_MS;
    let raf = 0;
    let last = performance.now();
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min(2, (now - last) / 16.7);
      last = now;
      [W, H] = view();
      if (now > next) {
        wi = (wi + 1) % 3;
        targets = targetsFor(words()[wi], W, H, gap);
        assign();
        next = now + HOLD_MS;
      }
      // Trails: the night takes the light back a little each frame.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5, 5, 8, 0.22)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const t = now / 1000;
      for (let i = 0; i < ps.length; i += 1) {
        const p = ps[i];
        if (p.t && !reduced) {
          // A spring to its point, with a breath of drift so it never sets hard.
          const tx = p.t[0] + Math.sin(t * 1.3 + p.ph) * 1.2;
          const ty = p.t[1] + Math.cos(t * 1.1 + p.ph) * 1.2;
          p.vx = (p.vx + (tx - p.x) * 0.018 * dt) * 0.88;
          p.vy = (p.vy + (ty - p.y) * 0.018 * dt) * 0.88;
        } else if (!reduced) {
          // The ones left over drift about like dust in a beam.
          p.vx = (p.vx + Math.sin(t * 0.3 + p.ph + p.y * 0.004) * 0.04 * dt) * 0.98;
          p.vy = (p.vy + Math.cos(t * 0.27 + p.ph + p.x * 0.004) * 0.04 * dt) * 0.98;
        } else if (p.t) {
          p.x = p.t[0];
          p.y = p.t[1];
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Colour runs across the screen, the poster's ink into warm white.
        ctx.fillStyle = ramp[Math.max(0, Math.min(RAMP - 1, Math.floor((p.x / W) * RAMP)))];
        ctx.globalAlpha = p.t ? 1 : 0.4;
        const sp = Math.min(3, Math.hypot(p.vx, p.vy) * 0.25);
        ctx.fillRect(p.x, p.y, p.s + sp, p.s);
      }
      ctx.globalAlpha = 1;
    };
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, W, H);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div className={styles.particles}>
      <canvas ref={canvasRef} className={styles.sheet} />
      <p className={styles.away}>Ken is away from his desk</p>
    </div>
  );
}

export default function Screensaver() {
  const { screensaverActive, setScreensaverActive, unlock } = useOS();
  const [saver] = useState(pickSaver);
  const [time, setTime] = useState(() => formatClock(new Date()));

  useEffect(() => {
    if (showNow()) setScreensaverActive(true);
  }, [setScreensaverActive]);

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
    if (!screensaverActive) return undefined;
    const id = setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, [screensaverActive]);

  const since = useRef(0);
  useEffect(() => {
    if (screensaverActive) since.current = performance.now();
  }, [screensaverActive]);
  const dismiss = () => {
    if (performance.now() - since.current > 900) setScreensaverActive(false);
  };

  // Any sign of life wakes it, keys and scrolls included (the overlay itself
  // never has focus, so they are heard on the window). A short grace period
  // first, so the move that started it (with ?saver-now) does not end it.
  useEffect(() => {
    if (!screensaverActive) return undefined;
    const wake = () => {
      if (performance.now() - since.current > 900) setScreensaverActive(false);
    };
    const events = ['keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, wake));
  }, [screensaverActive, setScreensaverActive]);

  if (!screensaverActive) return null;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className={`${styles.screensaver} ${saver === 'print' ? styles.light : ''}`} onMouseMove={dismiss} onClick={dismiss} role="presentation">
      {saver === 'print' ? <PrintRun reduced={reduced} /> : <Particles reduced={reduced} />}
      {saver === 'print' && <div className={styles.clock}>{time}</div>}
      <p className={styles.hint}>Move the mouse or press a key to wake</p>
    </div>
  );
}
