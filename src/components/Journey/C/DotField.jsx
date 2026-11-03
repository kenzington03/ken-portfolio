import { useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';

// The ground the hero and About share: the design canvas's dot grid, on the
// hero's paper, one sheet under both. Where the ball hits, a ripple runs out
// through the dots (addRipple), the way a drop moves water.

const STEP = 24; // the grid, px
const DOT = 1.1; // a dot's radius, px
const SPEED = 520; // the ripple's front, px/s
const WIDTH = 30; // its thickness, px
const LIFE = 2.2; // s

const ripples = [];
let wake = null;
/** A ripple from (x, y) on screen, `amp` px at its strongest. */
export function addRipple(x, y, amp = 10) {
  ripples.push({ x, y, amp, t0: performance.now() });
  wake?.();
}

export default function DotField({ className, opacity }) {
  const ref = useRef(null);
  const opRef = useRef(1);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let dpr = 1;
    let W = 0;
    let H = 0;
    let raf = 0;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };
    const draw = (now) => {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgb(18 18 20 / 0.16)';
      for (let i = ripples.length - 1; i >= 0; i -= 1) if ((now - ripples[i].t0) / 1000 > LIFE) ripples.splice(i, 1);
      const live = ripples.map((r) => {
        const t = (now - r.t0) / 1000;
        return { x: r.x, y: r.y, front: SPEED * t, k: r.amp * Math.exp(-t * 1.7) };
      });
      ctx.beginPath();
      for (let y = 12; y < H + STEP; y += STEP) {
        for (let x = 12; x < W + STEP; x += STEP) {
          let dx = 0;
          let dy = 0;
          let grow = 0;
          for (const r of live) {
            const ox = x - r.x;
            const oy = y - r.y;
            const d = Math.hypot(ox, oy) || 1;
            const w = Math.exp(-(((d - r.front) / WIDTH) ** 2)) * r.k;
            if (w > 0.05) {
              dx += (ox / d) * w;
              dy += (oy / d) * w;
              grow += w * 0.09;
            }
          }
          const rr = DOT + Math.min(2, grow);
          ctx.moveTo(x + dx + rr, y + dy);
          ctx.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      if (ripples.length) raf = requestAnimationFrame(draw);
    };
    wake = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    size();
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      wake = null;
    };
  }, []);

  useMotionValueEvent(opacity, 'change', (o) => {
    if (ref.current && Math.abs(o - opRef.current) > 0.001) {
      opRef.current = o;
      ref.current.parentElement.style.opacity = o.toFixed(3);
      ref.current.parentElement.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
    }
  });

  return (
    <div className={className} aria-hidden>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
