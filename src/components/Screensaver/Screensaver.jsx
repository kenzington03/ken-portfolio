import { useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { readPalette } from '../Journey/C/palette.js';
import styles from './Screensaver.module.css';

const IDLE_MS = 90000;
const DISPLAY = "'Big Shoulders', 'Cabinet Grotesk', sans-serif";

// The screensaver (Ken's pick): Tides, full screen, with the time. Two others
// can still be tried with ?saver=print or ?saver=particles (remembered on
// that browser); ?saver=tides goes back; ?saver-now shows it at once.
//   tides      two soft colours fight over the whole screen, tile by tile,
//              under a huge clock whose figures are always the colour the
//              tiles beneath them are not; power-ups, a slow build, a
//              climax, and round again.
//   print      the bouncing logo, as a print run: Ken's name bounces and
//              leaves an ink stamp, two inks a hair off, at every wall it
//              hits, so a poster builds up behind it as it goes. Landing in
//              a corner slams a stamp of its own into that corner.
//   particles  the time, written in a few thousand points of light that
//              flow apart and gather into Ken's name, then what he does,
//              then the time again.
const SAVERS = ['tides', 'particles', 'print'];
const SAVER_KEY = 'ken:saver-v3'; // (v3: Tides is the default now)
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

/* ------------------------------------------------------------------ */
/* Tides                                                               */
/* ------------------------------------------------------------------ */

// Two soft colours fight over the whole screen, tile by tile: each ball
// turns the other side's tiles to its own as it bounces into them. The tiles
// are lit like a relief (a gradient across the screen, a highlight and a
// shadow on each) under a film of grain. The time sits over it, huge, its
// figures always the colour beneath them is not.
//
// It builds: the balls quicken as the round goes on, and power-ups drift in
// (faster, more often): a bolt (that side's balls speed up), a spark (that
// side gets another ball), a ring (a burst that turns a patch over). When
// one side has nearly all of it, or the round has run long, it ends: the
// light swells to white, the board resets, and it begins again.
const SIDE = [
  { top: '#efe9df', bottom: '#d9cfbf' }, // warm paper
  { top: '#3a4766', bottom: '#222b42' }, // dusk navy
];
const TILE = 30; // px a square
const TIDE_R = 9;
const BASE_SPEED = 260; // px per second, at the start of a round
const ROUND_S = 150; // a round's length, s
const POWERS = ['bolt', 'spark', 'ring'];

const mixHex = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};

function Tides({ reduced }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    const make = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [c, x];
    };
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = Math.ceil(W / TILE);
    const rows = Math.ceil(H / TILE);

    // Two sheets of tiles, one per side, lit; the board and its negative
    // are assembled from them tile by tile as tiles flip.
    const sheets = SIDE.map((side, k) => {
      const [c, x] = make();
      for (let r = 0; r < rows; r += 1) {
        for (let q = 0; q < cols; q += 1) {
          const tx = q * TILE;
          const ty = r * TILE;
          x.fillStyle = mixHex(side.top, side.bottom, (r / rows) * 0.8 + (q / cols) * 0.2);
          x.fillRect(tx, ty, TILE, TILE);
          x.fillStyle = k ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.5)';
          x.fillRect(tx, ty, TILE, 1.5);
          x.fillRect(tx, ty, 1.5, TILE);
          x.fillStyle = k ? 'rgba(0,0,0,0.28)' : 'rgba(80,60,40,0.12)';
          x.fillRect(tx, ty + TILE - 1.5, TILE, 1.5);
          x.fillRect(tx + TILE - 1.5, ty, 1.5, TILE);
        }
      }
      return c;
    });
    const [board, bx] = make();
    const [neg, nx] = make();
    const grid = new Uint8Array(cols * rows);
    const paint = (q, r) => {
      const v = grid[r * cols + q];
      const sx = q * TILE * dpr;
      const sy = r * TILE * dpr;
      const sw = TILE * dpr;
      bx.setTransform(1, 0, 0, 1, 0, 0);
      nx.setTransform(1, 0, 0, 1, 0, 0);
      bx.drawImage(sheets[v], sx, sy, sw, sw, sx, sy, sw, sw);
      nx.drawImage(sheets[1 - v], sx, sy, sw, sw, sx, sy, sw, sw);
    };

    let balls = [];
    let powers = [];
    let round = 0;
    let nextPower = 0;
    let ending = 0; // the white swell at the end of a round, 0 .. 1
    const newBall = (team, x, y) => {
      const a = (Math.random() * 0.5 + 0.25) * (Math.random() < 0.5 ? 1 : -1) + (team ? Math.PI * 1.25 : Math.PI * 0.25);
      return { team, x, y, a, boost: 0, trail: [] };
    };
    const reset = () => {
      for (let r = 0; r < rows; r += 1) for (let q = 0; q < cols; q += 1) grid[r * cols + q] = q < cols / 2 ? 0 : 1;
      for (let r = 0; r < rows; r += 1) for (let q = 0; q < cols; q += 1) paint(q, r);
      balls = [newBall(0, W * 0.25, H * 0.5), newBall(1, W * 0.75, H * 0.5)];
      powers = [];
      round = 0;
      nextPower = 9;
      ending = 0;
    };
    reset();
    const flip = (q, r, team) => {
      if (q < 0 || r < 0 || q >= cols || r >= rows) return false;
      const i = r * cols + q;
      if (grid[i] === team) return false;
      grid[i] = team;
      paint(q, r);
      return true;
    };

    // The clock, as a mask (redrawn when the minute changes).
    const [mask, mx] = make();
    let shown = '';
    const drawMask = () => {
      const now = new Date();
      const time = formatClock(now);
      const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      if (time + day === shown) return;
      shown = time + day;
      mx.clearRect(0, 0, W, H);
      mx.fillStyle = '#000';
      mx.textAlign = 'center';
      const size = Math.min(W * 0.32, H * 0.44);
      mx.font = `800 ${size}px ${DISPLAY}`;
      mx.fillText(time, W / 2, H / 2 + size * 0.34);
      mx.font = `700 ${Math.max(16, size * 0.09)}px ${DISPLAY}`;
      mx.fillText(day.toUpperCase(), W / 2, H / 2 + size * 0.34 + Math.max(28, size * 0.2));
    };
    const [clock, cx] = make();

    let raf = 0;
    let last = performance.now();
    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = reduced ? 0 : Math.min(0.03, (now - last) / 1000);
      last = now;
      round += dt;
      // The round builds: faster as it goes.
      const pace = 1 + Math.min(1.3, round / ROUND_S);
      // Power-ups drift in, more often as it goes.
      nextPower -= dt;
      if (nextPower <= 0 && powers.length < 3) {
        powers.push({ kind: POWERS[Math.floor(Math.random() * POWERS.length)], x: TILE * 3 + Math.random() * (W - TILE * 6), y: TILE * 3 + Math.random() * (H - TILE * 6), t: 0 });
        nextPower = Math.max(3, 11 - round / 18);
      }
      balls.forEach((b) => {
        const sp = BASE_SPEED * pace * (b.boost > 0 ? 1.7 : 1);
        b.boost -= dt;
        b.x += Math.cos(b.a) * sp * dt;
        b.y += Math.sin(b.a) * sp * dt;
        if (b.x < TIDE_R || b.x > W - TIDE_R) {
          b.a = Math.PI - b.a;
          b.x = Math.max(TIDE_R, Math.min(W - TIDE_R, b.x));
        }
        if (b.y < TIDE_R || b.y > H - TIDE_R) {
          b.a = -b.a;
          b.y = Math.max(TIDE_R, Math.min(H - TIDE_R, b.y));
        }
        for (let k = 0; k < 8; k += 1) {
          const t = (k / 8) * Math.PI * 2;
          if (flip(Math.floor((b.x + Math.cos(t) * TIDE_R) / TILE), Math.floor((b.y + Math.sin(t) * TIDE_R) / TILE), b.team)) {
            if (Math.abs(Math.cos(t)) > Math.abs(Math.sin(t))) b.a = Math.PI - b.a;
            else b.a = -b.a;
            break;
          }
        }
        b.a += (Math.random() - 0.5) * 0.02;
        b.trail.unshift([b.x, b.y]);
        b.trail.length = Math.min(b.trail.length, 10);
        // Power-ups: the ball that reaches one takes it.
        powers = powers.filter((p) => {
          if (Math.hypot(p.x - b.x, p.y - b.y) > 22) return true;
          if (p.kind === 'bolt') balls.filter((o) => o.team === b.team).forEach((o) => (o.boost = 6));
          if (p.kind === 'spark' && balls.length < 10) balls.push(newBall(b.team, b.x, b.y));
          if (p.kind === 'ring') {
            const q0 = Math.floor(p.x / TILE);
            const r0 = Math.floor(p.y / TILE);
            for (let dr = -3; dr <= 3; dr += 1) for (let dq = -3; dq <= 3; dq += 1) if (dr * dr + dq * dq <= 10) flip(q0 + dq, r0 + dr, b.team);
          }
          return false;
        });
      });
      powers.forEach((p) => (p.t += dt));
      // The end of a round: one side has nearly all of it, or it has run long.
      let mine = 0;
      for (let i = 0; i < grid.length; i += 1) mine += grid[i];
      const share = mine / grid.length;
      if (!ending && (share < 0.12 || share > 0.88 || round > ROUND_S + 30)) ending = 0.0001;
      if (ending) {
        ending += dt / 2.6;
        if (ending >= 1) reset();
      }

      // The board, then the clock cut from its negative.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // A slow push in over the round: cinematic, barely felt.
      const zoom = 1 + Math.min(1, round / ROUND_S) * 0.04;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.drawImage(board, 0, 0);
      drawMask();
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, clock.width, clock.height);
      cx.drawImage(neg, 0, 0);
      cx.globalCompositeOperation = 'destination-in';
      cx.drawImage(mask, 0, 0);
      cx.globalCompositeOperation = 'source-over';
      ctx.drawImage(clock, 0, 0);
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, (canvas.width * (1 - zoom)) / 2, (canvas.height * (1 - zoom)) / 2);
      // Power-ups: a soft ring and a mark, breathing.
      powers.forEach((p) => {
        const pulse = 1 + Math.sin(p.t * 4) * 0.12;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '600 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.kind === 'bolt' ? '⚡' : p.kind === 'spark' ? '✦' : '◎', p.x, p.y + 0.5);
      });
      // The balls: soft spheres in the other side's colours, with a trail.
      balls.forEach((b) => {
        const col = SIDE[1 - b.team];
        b.trail.forEach(([x, y], i) => {
          ctx.globalAlpha = (1 - i / b.trail.length) * (b.boost > 0 ? 0.35 : 0.18);
          ctx.fillStyle = col.top;
          ctx.beginPath();
          ctx.arc(x, y, TIDE_R * (1 - i / 14), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, TIDE_R);
        g.addColorStop(0, col.top);
        g.addColorStop(1, col.bottom);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, TIDE_R, 0, Math.PI * 2);
        ctx.fill();
      });
      // The vignette, and at the end of a round, the swell of light.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, `rgba(10,12,20,${0.28 + Math.min(1, round / ROUND_S) * 0.14})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
      if (ending) {
        ctx.fillStyle = `rgba(250,248,242,${Math.sin(Math.PI * Math.min(1, ending)) * 0.96})`;
        ctx.fillRect(0, 0, W, H);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return <canvas ref={canvasRef} className={styles.tides} />;
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
    <div className={`${styles.screensaver} ${saver === 'print' ? styles.light : ''} ${saver === 'tides' ? styles.tidesRoom : ''}`} onMouseMove={dismiss} onClick={dismiss} role="presentation">
      {saver === 'tides' ? <Tides reduced={reduced} /> : saver === 'print' ? <PrintRun reduced={reduced} /> : <Particles reduced={reduced} />}
      {saver === 'print' && <div className={styles.clock}>{time}</div>}
      <p className={styles.hint}>Move the mouse or press a key to wake</p>
    </div>
  );
}
