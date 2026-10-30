// Hero A, "Screenshot". On a Mac the camera-shutter sound *is* the screenshot
// sound, so the reel's freeze becomes a ⌘⇧4: while Ken walks in, the macOS
// crosshair finds him and drags a selection; letting go freezes him
// mid-stride with the shutter, and the capture shrinks into the floating
// screenshot thumbnail, stamped with the visitor's own clock. The visitor is
// using the Mac before anyone has said "Mac".
//
// Everything after `go` runs off one rAF clock and writes styles directly.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Figure, { Slot, WALK_MS } from './Figure.jsx';
import styles from './hero.module.css';

const CURSOR_IN = 0.3; // fraction of the walk when the crosshair shows up
const DRAG_FROM = 0.46; // ...and starts dragging (ends exactly as he lands)
const LAND_MS = 720;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

const pad2 = (n) => String(n).padStart(2, '0');
function fileName(d = new Date()) {
  return `Screenshot ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} at ${pad2(d.getHours())}.${pad2(d.getMinutes())}.${pad2(d.getSeconds())}`;
}

/** Where the selection ends up: Ken's final rect, framed a little loose. */
function measure(stage, fig) {
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  const fx = fig.offsetLeft;
  const fy = fig.offsetTop;
  const fw = fig.offsetWidth;
  const fh = fig.offsetHeight;
  const x0 = Math.max(12, fx - fw * 0.16);
  const y0 = Math.max(12, fy - fh * 0.07);
  const x1 = Math.min(W - 12, fx + fw * 1.12);
  const y1 = Math.min(H - 20, fy + fh * 0.96);
  return { W, H, fx, fy, fw, fh, x0, y0, x1, y1 };
}

/** The floating thumbnail's resting place, bottom-right like macOS. */
function dock(g) {
  const bw = g.x1 - g.x0;
  const bh = g.y1 - g.y0;
  const tw = Math.max(120, Math.min(168, g.W * 0.115));
  const s = tw / bw;
  const gutter = Math.max(20, Math.min(56, g.W * 0.04));
  // Clear of the section dots on the right edge.
  const right = g.W > 900 ? gutter + 40 : gutter;
  return { s, x: g.W - right - tw, y: g.H - gutter - bh * s - 22, w: tw, h: bh * s };
}

export default function HeroScreenshot({ go, reduced, instant, src, poster, onShutter, onDone }) {
  const [phase, setPhase] = useState(instant ? 'still' : 'wait');
  const [shot, setShot] = useState(null); // { g, name } once captured
  const [landed, setLanded] = useState(!!instant);
  const stageRef = useRef(null);
  const figRef = useRef(null);
  const boxRef = useRef(null);
  const cursorRef = useRef(null);
  const readRef = useRef(null);
  const thumbRef = useRef(null);
  const canvasRef = useRef(null);
  const done = useRef(false);
  const arrived = useRef(false);

  const geometry = () => measure(stageRef.current, figRef.current.el);

  const capture = useCallback(
    (quiet) => {
      if (done.current) return;
      done.current = true;
      setPhase('still');
      if (!quiet) onShutter?.();
      setShot({ g: geometry(), name: fileName(), quiet: quiet || reduced });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onShutter, reduced],
  );

  // Instant (Shut Down replay): already captured, nothing animates.
  useEffect(() => {
    if (instant) {
      done.current = true;
      setShot({ g: geometry(), name: fileName(), quiet: true });
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The crosshair clock.
  useEffect(() => {
    if (!go || done.current) return undefined;
    if (reduced) {
      capture(false);
      return undefined;
    }
    setPhase('walk');
    const g = geometry();
    const cur = cursorRef.current;
    const box = boxRef.current;
    const read = readRef.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now) => {
      const k = (now - t0) / WALK_MS;
      // Crosshair drifts in to the top-left corner, then drags.
      const appear = clamp01((k - CURSOR_IN) / 0.12);
      const drag = easeInOut(clamp01((k - DRAG_FROM) / (1 - DRAG_FROM)));
      const cx = drag > 0 ? lerp(g.x0, g.x1, drag) : lerp(g.x0 - 60, g.x0, easeOut(appear));
      const cy = drag > 0 ? lerp(g.y0, g.y1, drag) : lerp(g.y0 - 36, g.y0, easeOut(appear));
      cur.style.opacity = String(appear);
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (drag > 0) {
        const w = cx - g.x0;
        const h = cy - g.y0;
        box.style.opacity = '1';
        box.style.transform = `translate3d(${g.x0}px, ${g.y0}px, 0)`;
        box.style.width = `${w}px`;
        box.style.height = `${h}px`;
        read.textContent = `${Math.round(w)}  ${Math.round(h)}`;
      } else {
        read.textContent = `${Math.round(cx)}  ${Math.round(cy)}`;
      }
      // Release when he has landed (placeholder) or the drag is over (video
      // still walking: hold the selection and wait for him).
      if (k >= 1 && arrived.current) {
        capture(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go, reduced]);

  const onArrive = () => {
    arrived.current = true;
  };

  // After the click: selection blinks out, the capture lifts and docks.
  useLayoutEffect(() => {
    if (!shot) return undefined;
    const el = thumbRef.current;
    if (src && canvasRef.current) figRef.current?.grab(canvasRef.current);
    const d = dock(shot.g);
    const end = [
      `translate3d(${d.x}px, ${d.y}px, 0) scale(${d.s})`,
      `${10 / d.s}px`,
      `0 ${16 / d.s}px ${48 / d.s}px rgba(0,0,0,0.55), 0 0 0 ${1 / d.s}px rgba(255,255,255,0.22)`,
    ];
    const settle = () => {
      el.style.transform = end[0];
      el.style.borderRadius = end[1];
      el.style.boxShadow = end[2];
      setLanded(true);
    };
    if (shot.quiet) {
      settle();
      if (!instant) onDone?.();
      return undefined;
    }
    const from = `translate3d(${shot.g.x0}px, ${shot.g.y0}px, 0) scale(1)`;
    el.style.transform = from;
    const anim = el.animate(
      [
        { transform: from, borderRadius: '0px', boxShadow: '0 0 0 0 rgba(0,0,0,0)', offset: 0 },
        { transform: from, borderRadius: '0px', boxShadow: '0 0 0 0 rgba(0,0,0,0)', offset: 0.22 },
        { transform: end[0], borderRadius: end[1], boxShadow: end[2] },
      ],
      { duration: LAND_MS + 160, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1.04)', fill: 'forwards' },
    );
    anim.onfinish = settle;
    const t = setTimeout(() => onDone?.(), 320);
    return () => {
      clearTimeout(t);
      anim.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot]);

  // Keep the thumbnail docked through resizes.
  useEffect(() => {
    if (!landed || !shot) return undefined;
    const onResize = () => {
      const g = { ...shot.g, ...{ W: stageRef.current.clientWidth, H: stageRef.current.clientHeight } };
      const d = dock(g);
      const el = thumbRef.current;
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) scale(${d.s})`;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [landed, shot]);

  const g = shot?.g;
  const d = g ? dock(g) : null;

  return (
    <div ref={stageRef} className={`${styles.stage} ${styles.shotStage}`} aria-hidden>
      <Figure ref={figRef} phase={phase} src={src} poster={poster} onArrive={onArrive} className={styles.shotFigure} />

      <div ref={boxRef} className={`${styles.selection} ${shot ? styles.selectionGone : ''}`} />
      {shot && !shot.quiet && (
        <div
          className={styles.selFlash}
          style={{ transform: `translate3d(${g.x0}px, ${g.y0}px, 0)`, width: g.x1 - g.x0, height: g.y1 - g.y0 }}
        />
      )}
      <div ref={cursorRef} className={`${styles.crosshair} ${shot ? styles.crosshairGone : ''}`}>
        <svg viewBox="0 0 32 32" width="32" height="32">
          <path d="M16 2v28M2 16h28" stroke="#fff" strokeWidth="3.2" strokeLinecap="square" />
          <path d="M16 2v28M2 16h28" stroke="#111" strokeWidth="1.2" strokeLinecap="square" />
        </svg>
        <span ref={readRef} className={styles.readout} />
      </div>

      {shot && (
        <>
          <div
            ref={thumbRef}
            className={styles.thumb}
            style={{ width: g.x1 - g.x0, height: g.y1 - g.y0 }}
          >
            <div
              className={styles.thumbFig}
              style={{ left: g.fx - g.x0, top: g.fy - g.y0, width: g.fw, height: g.fh }}
            >
              {src ? <canvas ref={canvasRef} className={styles.thumbCanvas} /> : <Slot />}
            </div>
          </div>
          <span
            className={`${styles.thumbName} ${landed ? styles.thumbNameOn : ''}`}
            style={{ left: d.x, top: d.y + d.h + 10, width: d.w }}
          >
            {shot.name}
          </span>
        </>
      )}
    </div>
  );
}
