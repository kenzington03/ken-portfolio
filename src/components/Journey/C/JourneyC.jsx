// Journey C: Ken's own flow, from his notes (v4). One light set, then the dark:
//   Loader: the lens iris opens with real load progress.
//   A pinned deck driven by scroll, on paper over a design-canvas grid:
//       Hero: a printed poster, Ken drawn in front of his name in blue ink
//       → About: "10 years" rolls up, the statement types, the prints land
//       → Career timeline: the ruler fills and pans in, each role (company,
//         title, years) arrives; it plays on by itself once started
//       → the camera pulls back until the whole career is the Apple logo;
//         the line rises; the logo settles on the lid as the page dissolves
//         into the dark and the MacBook comes up
//   → Build / Move / Ship: the Mac swings from overhead to the front
//   → lid opens → welcome → macOS.
// Same contract as the other intros.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import BriefSheet from '../../Brief/BriefSheet.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { CHAPTER_STOPS, POSES, tintChapters } from '../../Intro3/timeline.js';
import { SERVICES } from '../../../data/services.js';
import { playShutter, preloadShutter } from './sfx.js';
import MacRoom from '../MacRoom.jsx';
import TimelineC, { TIMELINE_NOW, TIP_R, timelineBallAt, timelineSpinAt, timelineDrift, timelineGrid, timelineLayout, timelineStops } from './TimelineC.jsx';
import PhoneEnding, { PHONE_STOPS, phoneLogoPoint } from './PhoneEnding.jsx';
import MePanel from './MePanel.jsx';
import Ball3D from './Ball3D.jsx';
import useClock from '../../../hooks/useClock.js';
import { PALETTES, paletteStyle, readPalette, savePalette } from './palette.js';
import styles from './JourneyC.module.css';

const EASE = [0.16, 1, 0.3, 1];
// Same file the 3D rig loads (kept as a literal so this chunk stays free of three.js).
const MODEL_SRC = '/models/macbook-rigged.glb';

// Overhead from behind the hinge, so the lid's Apple logo reads upright (from
// the front it is upside down, as on a real closed MacBook). A touch toward
// the camera (straight down would flip the rig). Into Build the camera swings
// half way round the laptop to its front.
const OVERHEAD = { yaw: Math.PI, pitch: 0.95, radius: 13.5, target: new THREE.Vector3(0, 0, -0.15) };
const FLOW_POSES = { hero: OVERHEAD, front: POSES.front };

// HERO ART: Ken, drawn from his own photos (flat shapes, print grain), on a
// transparent background. `aspect` is the file's width / height.
const HERO_ART = { src: '/assets/hero/art/ken.webp', aspect: 832 / 2138 };

// The loader: his ball, dribbling on the paper, over a shot clock that
// counts the real loading up to 100.
const MIN_LOAD_MS = 1700; // with the closing beat the loader lasts about 3.5 s on a fast line
const MAX_LOAD_MS = 9000;
// Returning visitors have the assets cached: they go straight in.
const SEEN_KEY = 'ken:intro-seen';
const seenBefore = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
// Someone who has been all the way into the Mac before.
const DONE_KEY = 'ken:journey-done';
const journeyDone = () => {
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return false;
  }
};
const markJourneyDone = () => {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    /* private mode: they will just play it through again */
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private mode: just show the loader again next time */
  }
};


/* ------------------------------------------------------------------ */
/* Loading: real progress (fonts, hero art, MacBook model)             */
/* ------------------------------------------------------------------ */

function useAssetProgress(enabled, withModel) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const parts = { fonts: 0, art: 0, model: 0 };
    const push = () => live && setP(parts.fonts * 0.15 + parts.art * 0.25 + parts.model * 0.6);
    const stream = async (url, key) => {
      try {
        const res = await fetch(url);
        const total = Number(res.headers.get('content-length')) || 0;
        if (!res.body || !total) {
          await res.arrayBuffer();
        } else {
          const reader = res.body.getReader();
          let got = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            got += value.length;
            parts[key] = Math.min(1, got / total);
            push();
          }
        }
      } catch {
        /* a failed asset must not trap the visitor on the loader */
      }
      parts[key] = 1;
      push();
    };
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      parts.fonts = 1;
      push();
    });
    stream(HERO_ART.src, 'art');
    // Phones (and machines without WebGL 2) never show the 3D Mac: no model.
    if (withModel) stream(MODEL_SRC, 'model');
    else parts.model = 1;
    return () => {
      live = false;
    };
  }, [enabled, withModel]);
  return p;
}

function Loader({ reduced, onDone, withModel }) {
  const real = useAssetProgress(true, withModel);
  const [shown, setShown] = useState(0);
  const [out, setOut] = useState(false);
  const realRef = useRef(0);
  realRef.current = real;

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    let closing = false;
    let disp = 0;
    const step = (now) => {
      const elapsed = now - t0;
      // Never ahead of real loading, never faster than the minimum time.
      const cap = elapsed >= MAX_LOAD_MS ? 1 : Math.min(realRef.current, elapsed / MIN_LOAD_MS);
      disp += (cap - disp) * 0.07;
      if (cap - disp < 0.004) disp = cap;
      setShown(disp);
      if (!closing && disp >= 0.995) {
        // Full time: the ball takes one last bounce and the paper is the hero's.
        closing = true;
        setTimeout(() => setOut(true), reduced ? 120 : 520);
        setTimeout(onDone, reduced ? 200 : 1080);
      }
      if (!closing) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.round(shown * 100);
  return (
    <div className={`${styles.loader} ${out ? styles.loaderOut : ''}`} role="status" aria-label={`Loading, ${pct} percent`}>
      {/* The ball, dribbling: it falls, squashes on the floor, springs up. */}
      <div className={styles.dribble} aria-hidden>
        <span className={styles.dribbleBall}>
          <img src="/assets/hero/art/ball-real.webp" alt="" draggable={false} />
        </span>
        <span className={styles.dribbleShadow} />
      </div>
      {/* The shot clock: the real progress, counted up. */}
      <p className={styles.clock} aria-hidden>
        {String(pct).padStart(3, '0')}
      </p>
      <span className={styles.loaderBar} aria-hidden>
        <span style={{ transform: `scaleX(${shown.toFixed(4)})` }} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

// Ken's own time, where he is, kept live.
const localTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

// The name: "Hi, I'm" bounces in, then Ken, then the rest of it slides out
// from behind the N. The display face prints KENNETH 3.23 em wide.
const NAME_EM = 3.2325;
const NAME_W = 0.85; // of the viewport's width
const HI = "Hi, I'm".split('');
const NAME_HEAD = ['K', 'E', 'N'];
const NAME_TAIL = ['N', 'E', 'T', 'H'];
const DESCRIPTOR = 'Designer. Building brands for 10+ years.';

// The poster's sheet: paper, grain and the clock. The name, Ken and his ball
// are drawn by the cast (below), so the name can sit between his body and
// the laptop he holds out.
function Hero() {
  const time = useClock(localTime);
  return (
    <div className={styles.hero}>
      <p className={styles.place}>
        <span>India</span>
        <span>{time}</span>
      </p>
      <h1 className={styles.srOnly}>
        Hi, I&apos;m Kenneth Nathanael. {DESCRIPTOR}
      </h1>
      <span className={styles.grain} aria-hidden />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The cast: Ken, his name and his ball, over the sections             */
/* ------------------------------------------------------------------ */

// One continuous camera move with Ken as its anchor:
//   Hero     he stands in the middle, behind his name, his head over it. He
//            arrives whole, then the camera pushes in a little; a touch of
//            depth follows the pointer.
//   → About  the camera keeps closing in as he crosses to the left and About
//            comes in from the right; he stays beside it, framed from the
//            chest up.
//   → Career he leaves with About.
// Nothing on him moves: the camera does. Each moment is a point on the
// drawing (in units of its height H) held at a point on screen, at a scale.
const isWide = () => window.innerWidth >= 1000 && window.innerWidth / window.innerHeight >= 1.2;

function castLayout(phone) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wide = !phone && isWide();
  const nameSize = Math.min((vw * NAME_W) / NAME_EM, vh * (wide ? 0.34 : 0.2));
  if (!wide) {
    // Phones: the name on top, the line under it, then him, standing clear.
    const nameTop = Math.max(128, vh * 0.16);
    const feet = vh - Math.max(96, vh * 0.12);
    // (room for the camera's push, which grows him upwards)
    const H = Math.min(vh * 0.6, (feet - (nameTop + nameSize * 0.74 + 64)) / (1 + PUSH));
    return { vw, vh, wide, H, nameSize, nameTop, neck: false, hero: { x: vw / 2, y: feet }, rest: { x: vw * 0.8, y: vh - 40 } };
  }
  const H = Math.min(vh * 0.8, vh - 110);
  const feet = vh - Math.max(24, Math.min(48, vh * 0.05));
  // The name sits across his chest, centred on the line the ball holds (the
  // middle of the screen), so the ball lands in the middle of the name; his
  // face and shoulders stay clear above it.
  const nameTop = Math.round(vh * 0.5 - nameSize * 0.37);
  return {
    vw,
    vh,
    wide,
    H,
    nameSize,
    nameTop,
    neck: false, // the name holds the ball's line as the camera pushes in
    hero: { x: vw / 2, y: feet },
    about: { x: vw * 0.2, y: vh * 0.5 },
    // Where the ball waits beside About, on the floor.
    rest: { x: vw * 0.4, y: vh - 22 },
  };
}

const PUSH = 0.07;
// Section 2 (Me): the camera close on him, framed from the waist up. The
// point of him held at the frame's anchor (his chest, in units of his
// height), and how much bigger he is than in the hero.
const ME_FOCUS = 0.36;
const ME_SCALE = 1.7;
// The ball. In the hero it rolls out from behind his legs along his floor
// and comes to rest bottom right. With the first scroll it glides, in one
// straight line, to the middle of the screen (the height of the career's
// line), and holds there: Me comes in around it, then the career's line
// slides in under it. BALL is its size in units of his height in the hero;
// BALL_SCREEN its size in the middle, as a share of the viewport's height.
// ROLL_K: how much it turns for the ground covered (a quarter of a true
// roll, so it rolls without whirling).
const BALL = 0.115;
const BALL_IN = { delay: 2500, ms: 1900 };
const BALL_REST_Y = 0.977; // its base on his floor, in units of his height
const BALL_HERO_X = 0.74; // where it rests, as a share of the screen's width
const BALL_SCREEN = 0.062;
const ROLL_K = 0.25;
// A ball rolling to a stop slows evenly (friction): its travel eases out
// as a square.
const outQuad = (t) => 1 - (1 - t) ** 2;


function Ball({ ballRef, ball3dRef }) {
  return (
    <div ref={ballRef} className={styles.ball} aria-hidden>
      <span className={styles.ballShadow} />
      <span className={styles.ballBody}>
        <Ball3D apiRef={ball3dRef} className={styles.ballCanvas} fallbackClassName={styles.ballSpin} />
      </span>
    </div>
  );
}

// The way on: written on the page, its arrow pointing down.
function ScrollNote({ noteRef, onClick }) {
  return (
    <button ref={noteRef} type="button" className={`${styles.note} ${styles.noteScroll}`} onClick={onClick}>
      <span>scroll down</span>
      <svg viewBox="0 0 40 70" aria-hidden>
        <path pathLength="1" d="M20 4C17 22 23 40 20 62" />
        <path pathLength="1" d="M9 50l11 13 11-14" />
      </svg>
    </button>
  );
}

function NameWord({ className }) {
  return (
    <span className={className}>
      {NAME_HEAD.map((c, i) => (
        <span key={`h${i}`} className={styles.nameLetter} style={{ '--i': i }}>
          <span>{c}</span>
        </span>
      ))}
      {NAME_TAIL.map((c, i) => (
        <span key={`t${i}`} className={styles.nameTail} style={{ '--i': i }}>
          <span>{c}</span>
        </span>
      ))}
    </span>
  );
}

function Cast({ progress, go, reduced, instant, phone, rootRef, tg, onScrollOn, nameStyle = 'riso' }) {
  const figRef = useRef(null);
  const nameRef = useRef(null);
  const ballRef = useRef(null);
  const ball3dRef = useRef(null);
  const noteRef = useRef(null);
  const [L, setL] = useState(() => castLayout(phone));
  useEffect(() => {
    const on = () => setL(castLayout(phone));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [phone]);

  // The name lands (two frames after it may, so there is a start to animate from).
  const on = !!(go || instant || reduced);
  const [up, setUp] = useState(!!(instant || reduced));
  useEffect(() => {
    if (!on || up) return undefined;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setUp(true));
    });
    return () => cancelAnimationFrame(id);
  }, [on, up]);

  // The pointer, for a little depth on the hero (fine pointers only).
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const move = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reduced]);

  const startRef = useRef(null);
  useEffect(() => {
    if (go && startRef.current == null) startRef.current = performance.now();
  }, [go]);

  useEffect(() => {
    let raf = 0;
    // Only what changed is written: a custom property set on the deck makes
    // the browser restyle everything under it, so it must not happen every
    // frame for nothing (least of all under the timeline and the Mac).
    const last = {};
    const put = (el, key, prop, value) => {
      if (!el || last[key] === value) return;
      last[key] = value;
      if (prop.startsWith('--')) el.style.setProperty(prop, value);
      else el.style[prop] = value;
    };
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const fig = figRef.current;
      if (!fig) return;
      const { H, vw, vh, wide } = L;
      const v = progress.get();
      const a = smooth01(within(v, SPAN['hero>ab']));
      const b = smooth01(within(v, SPAN['ab>tl']));
      const t0 = startRef.current;
      const since = t0 == null ? -1 : now - t0;
      // Arrives whole, then the camera pushes in.
      const shown = reduced ? (t0 == null ? 0 : 1) : clamp01(since / 800);
      const push = reduced ? 1 : 1 + PUSH * smooth01(clamp01((since - 700) / 2200));

      const p = pointer.current;
      p.sx += (p.x - p.sx) * 0.06;
      p.sy += (p.y - p.sy) * 0.06;
      const depth = 1 - a;
      const root = rootRef.current;
      if (root) {
        put(root, 'px', '--px', (p.sx * depth).toFixed(3));
        put(root, 'py', '--py', (p.sy * depth).toFixed(3));
      }

      // The name rides out with the hero's page, a touch of depth against him.
      const name = nameRef.current;
      const nameGone = a >= 1;
      put(name, 'nop', 'opacity', nameGone || t0 == null ? '0' : '1');
      if (!nameGone) {
        const nx = (wide ? -a * vw : 0) - p.sx * 14 * depth;
        const ny = (wide ? 0 : -a * vh) - p.sy * 8 * depth;
        const ns = 1 + (push - 1) * 0.3;
        put(name, 'ntf', 'transform', `translate3d(${nx.toFixed(1)}px, ${ny.toFixed(1)}px, 0) translateX(-50%) scale(${ns.toFixed(4)})`);
      }

      // The camera on him. The hero holds his feet in place (the push grows
      // him upwards); About holds his chest, closer.
      const w = H * HERO_ART.aspect;
      const camAt = (aa, bb) => {
        let px = 0.5;
        let py = 1;
        let S = push;
        let qx = L.hero.x;
        let qy = L.hero.y;
        if (wide) {
          // Into Me the camera pushes in on him: he grows, framed from the
          // waist up, his face in the upper third, on the left.
          py = 1 + (ME_FOCUS - 1) * aa;
          S = push + (ME_SCALE - push) * aa;
          qx += (L.about.x - qx) * aa;
          // Out with Me, to the left, as the pan carries on.
          qx -= bb * vw;
          qy += (L.about.y - qy) * aa;
        } else {
          qy -= aa * vh; // leaves with the hero, upwards
        }
        qx += p.sx * 12 * depth;
        qy += p.sy * 8 * depth + (1 - shown) * 24;
        return { left: qx - px * w * S, top: qy - py * H * S, S };
      };
      const cam = camAt(a, b);

      // The ball: it rolls out from behind his legs to the bottom right;
      // the first scroll glides it in a straight line to the middle (the
      // career line's height), where it holds while the world moves round
      // it; at the end of the career it opens into the Apple logo there.
      const ball = ballRef.current;
      const b3 = ball3dRef.current;
      if (ball) {
        const h0 = camAt(0, 0);
        const heroD = H * BALL * h0.S;
        const midD = Math.round(vh * BALL_SCREEN);
        const startX = h0.left + (w * h0.S) / 2; // behind his legs
        const heroX = vw * BALL_HERO_X;
        const floorY = h0.top + BALL_REST_Y * H * h0.S - heroD / 2; // its centre on his floor
        const cx = vw / 2;
        const cy = tg.rulerY;
        const enter = reduced || instant ? 1 : outQuad(clamp01((since - BALL_IN.delay) / BALL_IN.ms));
        let size = heroD;
        let x = startX + (heroX - startX) * enter;
        let y = floorY;
        let rz = (-(x - startX) / (heroD / 2)) * 0.6;
        let fade = 1;
        let floor = 1;
        let seen = t0 != null && enter > 0;
        if (a > 0) {
          // The glide: one straight line, bottom right to the middle.
          x = heroX + (cx - heroX) * a;
          y = floorY + (cy - floorY) * a;
          size = heroD + (midD - heroD) * a;
          floor = 1 - smooth01(within(a, [0, 0.4]));
          rz -= (Math.hypot(x - heroX, y - floorY) * ROLL_K) / (size / 2);
        }
        if (a >= 1) {
          x = cx;
          y = cy;
          // Onto the career it eases down to the knob's size.
          size = midD + (TIP_R * 2 - midD) * smooth01(b);
          floor = 0;
          // Held: it turns as the world passes under it.
          rz -= (b * vw * ROLL_K) / (size / 2);
        }
        if (v >= SPAN.tl[0]) {
          const rr = v >= SPAN.now[0] ? within(within(v, SPAN.now), REWIND) ** 1.6 : 0;
          const pp = v >= SPAN.now[0] ? TIMELINE_NOW : within(v, SPAN.tl) * TIMELINE_NOW;
          rz -= (((timelineSpinAt(tg, pp) - timelineSpinAt(tg, 0)) * Math.PI) / 180) * ROLL_K + rr * 3;
          const open = within(within(v, SPAN.now), OPEN);
          size = TIP_R * 2 * (1 + 0.16 * smooth01(open));
          fade = 1 - smooth01(within(open, [0.05, 0.75]));
          seen = !reduced && open < 1;
        }
        put(ball, 'bop', 'opacity', seen ? fade.toFixed(3) : '0');
        if (seen) {
          const r = size / 2;
          put(ball, 'btf', 'transform', `translate3d(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px, 0)`);
          put(ball, 'bw', 'width', `${size.toFixed(1)}px`);
          put(ball, 'bh', 'height', `${size.toFixed(1)}px`);
          put(ball, 'bfloor', '--floor', floor.toFixed(3));
          b3?.set(size, rz, 0);
        }
      }

      // "scroll down": once the ball has come to rest, gone with the first scroll.
      const note = noteRef.current;
      if (note) {
        const noteOn = a === 0 && (reduced || instant || since > BALL_IN.delay + BALL_IN.ms * 0.7);
        put(note, 'nop2', 'opacity', noteOn ? '1' : (1 - clamp01(a / 0.12)).toFixed(3));
        put(note, 'nev', 'pointerEvents', a < 0.05 ? 'auto' : 'none');
        if (noteOn && !note.classList.contains(styles.noteOn)) note.classList.add(styles.noteOn);
        if (a > 0.3 && note.classList.contains(styles.noteOn)) note.classList.remove(styles.noteOn);
      }

      // Gone with About: nothing to draw until the page comes back up.
      if (b >= 1 || (!wide && a >= 1)) {
        put(fig, 'op', 'opacity', '0');
        return;
      }
      const tf = `translate3d(${cam.left.toFixed(1)}px, ${cam.top.toFixed(1)}px, 0) scale(${cam.S.toFixed(4)})`;
      put(fig, 'op', 'opacity', shown.toFixed(3));
      put(fig, 'tf', 'transform', tf);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [L, progress, reduced, instant, rootRef, tg]);

  const figStyle = { width: L.H * HERO_ART.aspect, height: L.H };
  return (
    <div className={`${styles.cast} ${up ? styles.castUp : ''} ${L.wide ? '' : styles.castNarrow}`}>
      {/* Under him in the stack: it rolls out from behind his legs. */}
      <Ball ballRef={ballRef} ball3dRef={ball3dRef} />
      <div ref={figRef} className={styles.castFig} style={figStyle} aria-hidden>
        {/* His shadow, cast from his own shoes: tight where each sole meets
            the floor, soft where it falls away to the right. */}
        <img className={styles.castGround} src="/assets/hero/art/ken-ground.webp" alt="" draggable={false} />
        <img className={styles.castArt} src={HERO_ART.src} alt="" draggable={false} fetchPriority="high" />
      </div>

      {/* The name, in front of him: he stands behind it. */}
      <div ref={nameRef} className={`${styles.name} ${styles[`name_${nameStyle}`] || ''}`} aria-hidden style={{ top: L.nameTop, '--name-size': `${L.nameSize.toFixed(1)}px` }}>
        <span className={styles.hi}>
          {HI.map((c, i) => (
            <span key={i} style={{ '--i': i }}>
              {c === ' ' ? '\u00a0' : c}
            </span>
          ))}
        </span>
        {/* Printed twice: a solid pass (with the orange one a hair off), then
            the speckled ink over it, so he never shows through the letters. */}
        <NameWord className={styles.nameFill} />
        <NameWord className={styles.nameWord} />
        <span className={styles.descriptor}>
          <b>Designer.</b> Building brands for 10+ years.
        </span>
      </div>

      <ScrollNote noteRef={noteRef} onClick={onScrollOn} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The deck: one pinned viewport in the dark, driven by scroll         */
/* ------------------------------------------------------------------ */

// Scroll budget per beat, in viewport heights.
const BEATS = [
  ['hero', 6], // short: the first scroll sets Ken walking at once
  ['hero>ab', 60], // the camera closes in on Ken as he crosses left and About comes in (phones: About rises as the hero lifts)
  ['about', 40], // "10 years" rolls up and both lines type themselves (on time)
  ['ab>tl', 60], // About leaves left with Ken, the timeline arrives from the right
  ['tl', 100], // the ball travels 2015 to Now, then the camera pulls back to the whole journey
  ['now', 110], // the career shrinks into the Apple logo; the line rises; the logo settles as the Mac comes up
];
const TOTAL = BEATS.reduce((n, [, len]) => n + len, 0);
const SPAN = (() => {
  const out = {};
  let at = 0;
  BEATS.forEach(([name, len]) => {
    out[name] = [at / TOTAL, (at + len) / TOTAL];
    at += len;
  });
  return out;
})();

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const sineInOut = (t) => (1 - Math.cos(Math.PI * t)) / 2;
const sineOut = (t) => Math.sin((Math.PI * t) / 2);
const smooth01 = (t) => t * t * (3 - 2 * t);
const within = (v, [a, b]) => clamp01((v - a) / (b - a));

/** Words that rise out of a blur one after another as `reveal` goes 0..1. */
function RiseWords({ text, reveal, className }) {
  const words = text.split(' ');
  return (
    <motion.p className={className} style={{ '--p': reveal, '--n': words.length }} aria-label={text.replace(' | ', ' ')}>
      {words.map((w, i) =>
        w === '|' ? (
          <br key={i} />
        ) : (
          <span key={i} className={styles.riseWord} style={{ '--i': i }} aria-hidden>
            {w}{' '}
          </span>
        ),
      )}
    </motion.p>
  );
}

/**
 * A panel's travel. It comes in over `enter` and leaves over `exit`; each end
 * can be horizontal ('x': in from the right, out to the left) or vertical
 * ('y': up from below, out over the top).
 */
function Panel({ progress, enter, exit, enterAxis = 'x', exitAxis = 'x', reduced, className = '', children, ...rest }) {
  // Gentle: the journey's glides already ease, and easing twice bunches the
  // whole move into the middle of the glide.
  const tin = (v) => (enter ? smooth01(within(v, SPAN[enter])) : 1);
  const tout = (v) => (exit ? smooth01(within(v, SPAN[exit])) : 0);
  const x = useTransform(progress, (v) => `${(enterAxis === 'x' ? (1 - tin(v)) * 100 : 0) - (exitAxis === 'x' ? tout(v) * 100 : 0)}%`);
  const y = useTransform(progress, (v) => `${(enterAxis === 'y' ? (1 - tin(v)) * 100 : 0) - (exitAxis === 'y' ? tout(v) * 100 : 0)}%`);
  // Reduced motion: no travel, panels simply swap.
  const opacity = useTransform(progress, (v) => {
    if (!reduced) return 1;
    const a = enter ? within(v, SPAN[enter]) : 1;
    const b = exit ? within(v, SPAN[exit]) : 0;
    return a > 0.5 && b <= 0.5 ? 1 : 0;
  });
  // Off-stage panels are removed from rendering entirely (not just hidden).
  const [offstage, setOffstage] = useState(!!enter);
  useMotionValueEvent(progress, 'change', (v) => {
    const a = enter ? within(v, SPAN[enter]) : 1;
    const b = exit ? within(v, SPAN[exit]) : 0;
    const off = a <= 0 || b >= 1;
    setOffstage((cur) => (cur === off ? cur : off));
  });
  return (
    <motion.div className={`${styles.panel} ${className}`} style={reduced ? { opacity } : { x, y }} hidden={offstage} aria-hidden={offstage || undefined} {...rest}>
      {children}
    </motion.div>
  );
}

// The lid's logo, reverse engineered from the 3D model (measured at 1440x900:
// 51 x 55 px, #090a0e, rotated 180 degrees as seen from behind the lid).
// Its width as a share of the lid's width, and how far below the lid's middle
// it sits (along the lid's depth), both in the lid's own units.
const LID_LOGO_W = 0.1033;
const LID_LOGO_DROP = 0.0059;
const LID_LOGO_FILL = '#090a0e';
// The Apple logo (same glyph as the menu bar's), and its exact bounds.
const APPLE_BOX = { x: 3.864, y: 2, w: 16.226, h: 20 };
const LOGO_EL_W = 100; // the logo element's width in CSS px before transforming
const LOGO_EL_H = (LOGO_EL_W * APPLE_BOX.h) / APPLE_BOX.w;
const APPLE_PATH =
  'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z';

// How tall the logo stands, as a share of the viewport height.
const LOGO_VH = 0.115;
const LOGO_VH_PHONE = 0.1;
// The middle of the apple's body (in the glyph's units): solid all round for
// a radius of about 5, so a dot there grows as a plain circle before the bite
// and the leaf show. The ball becomes the logo here.
const APPLE_HEART = { x: 11.6, y: 14.6 };
const HEART_CLIP = `${(((APPLE_HEART.x - APPLE_BOX.x) / APPLE_BOX.w) * 100).toFixed(2)}% ${(((APPLE_HEART.y - APPLE_BOX.y) / APPLE_BOX.h) * 100).toFixed(2)}%`;
// From the heart to the element's centre, in element px (before scaling).
const HEART_DX = ((APPLE_HEART.x - (APPLE_BOX.x + APPLE_BOX.w / 2)) * LOGO_EL_W) / APPLE_BOX.w;
const HEART_DY = ((APPLE_HEART.y - (APPLE_BOX.y + APPLE_BOX.h / 2)) * LOGO_EL_W) / APPLE_BOX.w;
const BALL_R = TIP_R; // the timeline's ball, in px
// When (as shares of "now"): the words step back, the line winds into the
// ball, the ball opens into the logo.
const CLEAR = [0, 0.05];
const REWIND = [0.02, 0.15];
const OPEN = [0.15, 0.28];
// The heart to the farthest point of the glyph (the leaf's tip), in its units.
const HEART_REACH = 13.6;
// What the logo says as it arrives.
// "|" breaks the line.
const STORY_LINE = "Everything I've made | lives in here.";
const STORY_SUB = 'Ten years of brands, campaigns and motion, on one Mac.';
const STORY_LINE_PHONE = STORY_LINE;
const STORY_SUB_PHONE = 'Ten years of brands, campaigns and motion.';
// From here (as a share of "now"), a click anywhere goes in.
const END_FROM = 0.22;

// The timeline playing on by itself: how long it rests on each role once it
// has landed and opened, and on the whole journey before it pulls back to the logo.
const AUTO_REST = 1500;
const AUTO_REST_NOW = 3200; // time to take in the whole journey, laid out
const AUTO_REST_LOGO = 2600; // time to read the line before the Mac drifts up
// The Mac's drift: each word to the next, slow and continuous.
const DRIFT_MS = 5600;

// The career plays as one continuous run: one scroll from Me sets the ball
// off, and it rolls 2015 to Now without stopping. Every leg (role to role)
// takes the same time; the ball eases off as it passes a role (so the label
// can be read) and picks up again between them, but never comes to rest.
// A speed profile per leg, turned into a position curve (0..1 over the leg).
const LEG_MS = 1900; // long enough to read each role as it passes
const WAVE = 0.62; // how much it slows at a role: speed there is 1 - WAVE
const profile = (w) => {
  const N = 400;
  const c = [0];
  for (let i = 0; i < N; i += 1) c.push(c[i] + w((i + 0.5) / N));
  const total = c[N];
  return {
    mean: total / N,
    curve: (u) => {
      const x = clamp01(u) * N;
      const i = Math.floor(x);
      return i >= N ? 1 : (c[i] + (c[i + 1] - c[i]) * (x - i)) / total;
    },
  };
};
const waveAt = (u) => 1 - WAVE * Math.cos(2 * Math.PI * u);
// Mid legs: slow past each role, quicker between.
const LEG_MID = profile(waveAt);
// The first leg sets off from rest; the last (on to Now, as the camera pulls
// back over the whole journey) comes to rest. Their speeds meet the mid legs'.
const LEG_FIRST = profile((u) => smooth01(Math.min(1, u / 0.5)) * waveAt(u));
const DRIFT = profile((u) => 1 - 0.45 * Math.cos(2 * Math.PI * u));
const LEG_LAST = profile((u) => waveAt(u) * (1 - smooth01(Math.max(0, (u - 0.3) / 0.7))));

// At the end of the story, still for this long: "Scroll down".
const IDLE_HINT_MS = 900;

// The journey as a game of four quarters, on a little scoreboard hung at the
// top. Each quarter fills as you play it. First time through, the quarters
// ahead are locked: the story is played in order. Back again, any quarter.
const QUARTERS = [
  { id: 'hero', label: 'Hi', range: () => [0, midOf(SPAN['hero>ab'])] },
  { id: 'about', label: 'Me', range: () => [midOf(SPAN['hero>ab']), midOf(SPAN['ab>tl'])] },
  { id: 'now', label: 'Career', range: () => [midOf(SPAN['ab>tl']), SPAN.now[0]] },
  { id: 'logo', label: 'The work', range: () => [SPAN.now[0], SPAN.now[0] + (SPAN.now[1] - SPAN.now[0]) * 0.31] },
];
const midOf = ([a, b]) => (a + b) / 2;

function Scoreboard({ progress, alpha, unlocked, goTo }) {
  const [at, setAt] = useState(0);
  const [reached, setReached] = useState(0);
  const fills = useRef([]);
  const read = (v) => {
    let q = 0;
    QUARTERS.forEach((x, i) => {
      const [a, b] = x.range();
      if (v >= a) q = i;
      const f = clamp01((v - a) / (b - a));
      const el = fills.current[i];
      if (el) el.style.transform = `scaleX(${f.toFixed(4)})`;
    });
    setAt((cur) => (cur === q ? cur : q));
    setReached((cur) => Math.max(cur, q));
  };
  useMotionValueEvent(progress, 'change', read);
  useEffect(() => read(progress.get()), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.nav className={styles.score} style={{ opacity: alpha }} aria-label="Chapters">
      {QUARTERS.map((x, i) => {
        const locked = !unlocked && i > reached;
        return (
          <button
            key={x.id}
            type="button"
            className={`${styles.quarter} ${i === at ? styles.quarterOn : ''} ${locked ? styles.quarterLocked : ''}`}
            onClick={() => !locked && goTo(x.id)}
            aria-disabled={locked || undefined}
            aria-current={i === at ? 'step' : undefined}
            title={locked ? 'Keep scrolling to get here' : undefined}
          >
            <span className={styles.qLabel}>{x.label}</span>
            <i aria-hidden>
              <span ref={(el) => (fills.current[i] = el)} />
            </i>
          </button>
        );
      })}
    </motion.nav>
  );
}

// Trying the poster's inks: swatches on localhost (or with ?palettes), so Ken
// can flip through them on the real page. Never shown to visitors.
const SHOW_SWATCHES = import.meta.env.DEV || /[?&]palettes\b/.test(window.location.search);

function Swatches({ current, onPick }) {
  return (
    <div className={styles.swatches} role="radiogroup" aria-label="Poster colours (preview only)">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={p.id === current}
          title={p.label}
          className={styles.swatch}
          style={{ '--a': p.pop, '--b': p.pop2 }}
          onClick={() => onPick(p)}
        />
      ))}
    </div>
  );
}

export default function JourneyC({ mode = 'open', active = true, onReachScreen, onSkip, onClosed, phone = false }) {
  const closing = mode === 'close';
  const [palette, setPalette] = useState(readPalette);
  // The Mac room's glow takes the poster's inks.
  tintChapters([palette.pop, palette.pop2, palette.pop]);
  const [reduced] = useState(prefersReducedMotion);
  // Phones get the iPhone ending (DOM), so they never load the 3D MacBook.
  const [use3D, setUse3D] = useState(() => !phone && hasWebGL2() && !prefersReducedMotion());
  const [loaded, setLoaded] = useState(() => closing || seenBefore());
  const [lines, setLines] = useState([false, false]);
  const [dark, setDark] = useState(closing);
  const [contactOpen, setContactOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  // Someone who has been all the way in before may skip and jump around.
  const [returning] = useState(journeyDone);
  const deckRef = useRef(null);
  const flatRef = useRef(!use3D && !phone);
  flatRef.current = !use3D && !phone;
  const runwayRef = useRef(null);
  const cancelRef = useRef(null);
  const timersRef = useRef([]);
  const logoRef = useRef(null); // the lid logo on screen, written by the 3D scene
  // True while the Shut Down replay is still closing the lid.
  const closingRef = useRef(closing);
  const handleClosed = useCallback(() => {
    closingRef.current = false;
    onClosed?.();
  }, [onClosed]);
  const later = (fn, ms) => timersRef.current.push(setTimeout(fn, ms));
  // About shows fully typed when there is nothing to watch: reduced motion,
  // or coming back from the Mac after Shut Down.
  const aboutInstant = reduced || closing;

  const { scrollYProgress: progress } = useScroll({ target: deckRef, offset: ['start start', 'end end'] });
  // The deck's timeline beat ends on the whole journey (TIMELINE_NOW).
  const tlProgress = useTransform(progress, (v) => within(v, SPAN.tl) * TIMELINE_NOW);
  // The hero's basketball lands on the line as the timeline arrives.
  const handoff = useTransform(progress, (v) => smooth01(within(v, SPAN['ab>tl'])));
  // On the career itself (not arriving, not winding into the logo): skippable.
  const [inCareer, setInCareer] = useState(false);
  useMotionValueEvent(progress, 'change', (v) => {
    const on = v >= SPAN.tl[0] && v < SPAN.now[0] + (SPAN.now[1] - SPAN.now[0]) * 0.02;
    setInCareer((cur) => (cur === on ? cur : on));
  });
  // The grid: a design canvas behind About and the timeline, one cell per
  // year, its lines through the ruler and the year ticks. It stays put while
  // About passes over it, then pans and zooms with the timeline's camera.
  const [tg, setTg] = useState(timelineLayout);
  useEffect(() => {
    const on = () => setTg(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  // Wide screens: the camera tracks Ken sideways from the hero into About.
  const [wide, setWide] = useState(() => !phone && isWide());
  useEffect(() => {
    const on = () => setWide(!phone && isWide());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [phone]);
  const stickyRef = useRef(null);
  // Q2: the prints land and drop their inks over the second half of the
  // arrival, settled by the stop.
  const meSpan = [SPAN['hero>ab'][0] + (SPAN['hero>ab'][1] - SPAN['hero>ab'][0]) * 0.4, SPAN.about[0] + (SPAN.about[1] - SPAN.about[0]) * 0.6];
  const gridSize = useTransform([tlProgress, timelineDrift], ([p]) => timelineGrid(tg, p).size);
  const gridPosition = useTransform([tlProgress, timelineDrift], ([p]) => timelineGrid(tg, p).position);

  // "Now", in two beats (the journey rests between them).
  //  1. Ten years wound into one dot: the words step back, the line rewinds
  //     into Now's ball like a tape measure as the ball comes to the middle,
  //     then the ball opens into the Apple logo (the logo, revealed from a
  //     circle the ball's size at the heart of the apple: the dot swells,
  //     then the bite and the leaf come). The line rises above it, ink on
  //     paper.
  //  2. The logo slips to where the lid's logo will be, then shrinks and turns
  //     to the lid's angle while the page dissolves into the MacBook: the
  //     background goes to night, the line goes white, the laptop comes up
  //     under the logo. The logo stays on the lid's spot and stays larger
  //     than the lid's own (painted) logo until they match, so it covers it.
  // Phones (and the flat fallback) have no lid: the logo turns white once,
  // with the line, and rests where the lock-screen clock will be.
  const lidRef = useRef(!phone && use3D);
  lidRef.current = !phone && use3D;
  const hasLid = () => lidRef.current && logoRef.current?.lidW > 0;
  const nowT = useTransform(progress, (v) => within(v, SPAN.now));
  // The night comes as the ball opens into the logo: paper to black, ink to
  // white, so the logo is born white on the dark the laptop will rise from.
  const DISSOLVE = [0.12, 0.3];
  const mid = (DISSOLVE[0] + DISSOLVE[1]) / 2;
  const paperOpacity = useTransform(nowT, (t) => 1 - smooth01(within(t, DISSOLVE)));
  // The deck's grain takes over from the hero's own as the hero leaves.
  const paperGrain = useTransform([progress, nowT], ([v, t]) => 0.5 * within(v, SPAN['hero>ab']) * (1 - within(t, DISSOLVE)));
  const tlFade = useTransform(nowT, (t) => within(t, CLEAR));
  // Winding in speeds up as it goes, like a tape measure, and lands hard.
  const rewind = useTransform(nowT, (t) => within(t, REWIND) ** 1.6);
  const logoBase = () => (window.innerHeight * (phone ? LOGO_VH_PHONE : LOGO_VH)) / LOGO_EL_H;
  // The opening: a circle at the apple's heart, from the ball's size to the
  // whole logo (then no clip at all): it swells, then the bite and the leaf.
  const logoClip = useTransform(nowT, (t) => {
    const k = within(t, OPEN);
    if (k >= 1) return 'none';
    const e = inOut(k);
    const r0 = BALL_R / logoBase();
    const r = r0 + ((HEART_REACH * LOGO_EL_W) / APPLE_BOX.w - r0) * e;
    return `circle(${r.toFixed(2)}px at ${HEART_CLIP})`;
  });
  const scoreAlpha = useTransform(nowT, (t) => 1 - within(t, [0.18, 0.3]));
  const lineReveal = useTransform(nowT, (t) => within(t, [0.21, 0.305]));
  const subOpacity = useTransform(nowT, (t) => within(t, [0.25, 0.31]));
  const subY = useTransform(nowT, (t) => `${((1 - within(t, [0.25, 0.31])) * 8).toFixed(2)}px`);
  const lineOpacity = useTransform(nowT, (t) => (flatRef.current ? 1 : 1 - within(t, [0.93, 1])));
  // Ink on paper, white on night: it flips as the page crosses the middle.
  const lineColor = useTransform(nowT, (t) => {
    const k = within(t, [mid - 0.02, mid + 0.02]);
    const c = Math.round(18 + (236 - 18) * k);
    return `rgb(${c}, ${c}, ${Math.round(20 + (234 - 20) * k)})`;
  });
  // The glides do the easing; these stay gentle so nothing is rushed.
  const placeT = useTransform(nowT, (t) => smooth01(within(t, [0.33, 0.5])));
  const settleT = useTransform(nowT, (t) => smooth01(within(t, [0.33, 0.8])));
  // Where the logo ends: the 3D scene reports the lid's place and angle on
  // screen (logoRef). Until it has loaded, and on phones (no lid), a stand-in.
  const finalLogo = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const l = !phone && logoRef.current;
    if (l && l.lidW > 0) {
      const wpp = (LID_LOGO_W * l.lidW) / LOGO_EL_W; // lid units per element px
      const drop = LID_LOGO_DROP * l.lidW;
      return { x: l.x + l.ez[0] * drop, y: l.y + l.ez[1] * drop, m: [-l.ex[0] * wpp, -l.ex[1] * wpp, -l.ez[0] * wpp, -l.ez[1] * wpp] };
    }
    const k = (51 / 900) * (vh / LOGO_EL_W);
    if (phone) return { ...phoneLogoPoint(), m: [k, 0, 0, k] };
    return { x: vw / 2, y: vh * 0.638, m: [-k, 0, 0, -k * 0.857] };
  };
  const logoTransform = useTransform([placeT, settleT], ([place, settle]) => {
    // Where the ball wound in: the middle of the ruler, at the apple's heart.
    const start = logoBase();
    const x0 = tg.vw / 2 - HEART_DX * start;
    const y0 = tg.rulerY - HEART_DY * start;
    const f = finalLogo();
    const [a, b, c, d] = f.m;
    // Final matrix as rotate(theta) x [[sx, sk], [0, sy]], so it can be eased.
    let theta = Math.atan2(b, a);
    if (theta < -0.01) theta += Math.PI * 2; // always turn the same way
    const sx = Math.hypot(a, b);
    const sk = Math.cos(theta) * c + Math.sin(theta) * d;
    const sy = -Math.sin(theta) * c + Math.cos(theta) * d;
    const th = theta * settle;
    const ssx = start + (sx - start) * settle;
    const ssy = start + (sy - start) * settle;
    const ssk = sk * settle;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const x = x0 + (f.x - x0) * place;
    const y = y0 + (f.y - y0) * place;
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) matrix(${(cos * ssx).toFixed(5)}, ${(sin * ssx).toFixed(5)}, ${(cos * ssk - sin * ssy).toFixed(5)}, ${(sin * ssk + cos * ssy).toFixed(5)}, 0, 0)`;
  });
  // The logo turns chrome with the night. On the lid it dims into the lid's
  // own painted mark as it settles, so the laptop stops on one crisp logo.
  const inkOpacity = useTransform(nowT, (t) => within(t, OPEN));
  const whiteOpacity = useTransform(nowT, (t) => within(t, OPEN) * (hasLid() ? 1 - within(t, [0.6, 0.8]) : 1));
  // Once it has settled on the lid (0.8), it hands over to the lid's own
  // painted logo, so the laptop stops on a crisp mark, not two overlapping.
  // It takes over from the ball the moment the line is wound in (the ball
  // goes at the same moment: same dot, same place).
  const logoOpacity = useTransform(nowT, (t) => (t >= REWIND[1] ? 1 : 0) * (flatRef.current || !hasLid() ? 1 : 1 - within(t, [0.8, 0.86])));
  const gridOpacity = useTransform(nowT, (t) => 1 - within(t, [0, 0.1]));

  useMotionValueEvent(progress, 'change', (v) => {
    // About types itself as it arrives; back on the hero it resets, so the
    // next visit types again.
    const arrive = within(v, SPAN['hero>ab']);
    if (arrive > 0.55) setLines((cur) => (cur[0] ? cur : [true, cur[1]]));
    else if (arrive <= 0) setLines((cur) => (cur[0] || cur[1] ? [false, false] : cur));
  });
  useMotionValueEvent(nowT, 'change', (t) => {
    const d = t > mid;
    setDark((cur) => (cur === d ? cur : d));
  });

  useEffect(() => {
    preloadShutter();
    const timers = timersRef.current;
    return () => {
      cancelRef.current?.();
      timers.forEach(clearTimeout);
    };
  }, []);

  // No scrolling under the loader.
  useEffect(() => {
    if (loaded) return undefined;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      root.style.overflow = prev;
    };
  }, [loaded]);

  const onLoaded = useCallback(() => {
    markSeen();
    setLoaded(true);
  }, []);

  // Scrolling: the journey is a deck of stops, and one scroll (wheel, swipe,
  // key, sideways swipe) moves exactly one stop, whatever its length or
  // speed; the coasting tail is swallowed. The stops: the hero, About, each
  // role on the timeline, the logo with its line, the laptop, then Build,
  // Move and Ship. Past the last, the page dives into the Mac. Anything that
  // slips through (a touch fling the browser will not cancel, the scrollbar)
  // settles onto the nearest stop.
  // After Shut Down, the swipe that triggered it is still coasting: none of
  // it may drag the page off the closing Mac.
  // The timeline plays on by itself: the scroll that starts it sets it going,
  // and it moves on a role at a time, resting on each, through the whole
  // journey and into the logo. Scrolling along keeps pace with it (each scroll
  // still moves a stop, at once); scrolling back stops it and goes back;
  // scrolling forward again picks it up where it is.
  const goToIdRef = useRef(null);
  const cutRef = useRef(null); // the dip a skip goes through
  const autoRef = useRef(false);
  const contactRef = useRef(false);
  contactRef.current = contactOpen;
  useEffect(() => {
    if (!active) return undefined;
    let autoGlide = false; // the glide under way is the timeline playing on
    let autoTimer = 0;
    let last = 0;
    let prevMag = 0;
    let step = -1; // the stop the page is on, or gliding to (-1: none)
    let lastY = window.scrollY;
    let gliding = false;
    let touchY = null;
    let steppedAt = 0;
    let gestureSum = 0;
    let gestureSpent = false;
    let gestureFirst = 0;
    let gestureSure = false;
    let settleTimer = 0;
    // Reduced motion: the page scrolls normally, no stops.
    const stepping = !reduced;

    const vh = () => window.innerHeight;
    const deckAt = (f) => {
      const d = deckRef.current;
      return d.offsetTop + (d.offsetHeight - vh()) * f;
    };
    const spanAt = (span, t) => deckAt(span[0] + (span[1] - span[0]) * t);
    // The runway after the deck: the Mac's (desktop) or the iPhone's (phone).
    const runAt = (t) => {
      const r = runwayRef.current;
      if (!r) return null;
      const top = r.offsetTop;
      const end = phone ? top + r.offsetHeight - vh() : maxScroll();
      return top + (end - top) * t;
    };
    // The career's legs, as scroll targets with their own pace (see LEG_MS).
    const careerPath = () => {
      const ys = timelineStops().map((p) => spanAt(SPAN.tl, p / TIMELINE_NOW));
      const end = spanAt(SPAN.tl, 1);
      const leg = ys[1] - ys[0];
      const legs = [{ y: ys[0], ms: 2700, curve: sineInOut }];
      for (let i = 1; i < ys.length; i += 1) {
        // Speed (px/ms) at u is distance/time x w(u)/mean, so dividing the
        // time by the shape's mean makes every leg meet the next at a role.
        const shape = i === 1 ? LEG_FIRST : LEG_MID;
        legs.push({ y: ys[i], ms: LEG_MS / shape.mean, curve: shape.curve });
      }
      legs.push({ y: end, ms: (LEG_MS * ((end - ys[ys.length - 1]) / leg)) / LEG_LAST.mean, curve: LEG_LAST.curve });
      return legs;
    };
    const stops = () => {
      if (!deckRef.current) return [];
      const list = [
        { id: 'hero', y: deckAt(0) },
        // About sits at the end of its beat, so each move between hero,
        // About and the timeline is all crossing, no dead scroll.
        { id: 'about', y: spanAt(SPAN.about, 0.9), ms: 2700 },
        // The career, in one run from Me: the ball comes to the middle and the
        // ruler draws out of it, then it rolls role to role without stopping
        // and on to Now as the camera pulls back over the whole journey.
        // Then it pulls back further, slowly, until the whole career is the
        // Apple logo, and the line rises.
        { id: 'now', y: spanAt(SPAN.tl, 1), ms: 1700, path: careerPath() },
        { id: 'logo', y: spanAt(SPAN.now, 0.31), ms: 3600 },
        { id: 'mac', y: spanAt(SPAN.now, 0.88), ms: 3000 },
      ];
      if (runwayRef.current) (phone ? PHONE_STOPS : CHAPTER_STOPS).forEach((t, i) => list.push({ id: `chapter${i}`, y: runAt(t), ms: 1300 }));
      return list;
    };
    const glide = (y, ms, via, path) => {
      gliding = true;
      clearTimeout(settleTimer);
      cancelRef.current?.();
      const land = () => {
        // A touch cancels a tween (tweenScroll's own rule); here the glide
        // finishes what it started instead, so no stop is ever half reached.
        const to = Math.min(y, maxScroll());
        if (gliding && Math.abs(window.scrollY - to) > 2) {
          cancelRef.current = tweenScroll(to, 420, land);
          return;
        }
        gliding = false;
        lastY = window.scrollY;
        playOn();
      };
      // Glides ease gently (sine), so what they carry (a section changing,
      // the ball becoming the logo, the page becoming the laptop) is spread
      // over the whole glide instead of rushed through its middle.
      const curve = sineInOut;
      if (path) {
        // A run of legs, back to back, each at its own pace (the career).
        // Input mid-leg (a trackpad's tail) does not break the run: the leg
        // it cut short is finished from where it is, then the run goes on.
        let k = 0;
        const run = () => {
          if (!gliding) return;
          if (k > 0 && Math.abs(window.scrollY - path[k - 1].y) > 2) {
            cancelRef.current = tweenScroll(path[k - 1].y, 360, run, sineOut);
            return;
          }
          if (k >= path.length) {
            land();
            return;
          }
          const leg = path[k];
          k += 1;
          cancelRef.current = tweenScroll(leg.y, leg.ms, run, leg.curve);
        };
        run();
        return;
      }
      if (via) {
        // Two legs: it comes to rest at the waypoint, then sets off again
        // at once and slows into the stop (the ball starts turning into the
        // logo as soon as the zoom lands, and settles as the logo).
        // With a rest, it pauses there and sets off again gently instead.
        cancelRef.current = tweenScroll(via.y, via.ms, () => {
          if (!gliding) return;
          if (!via.rest) {
            cancelRef.current = tweenScroll(y, ms, land, sineOut);
            return;
          }
          const t = setTimeout(() => {
            if (gliding) cancelRef.current = tweenScroll(y, ms, land, curve);
          }, via.rest);
          cancelRef.current = () => clearTimeout(t);
        });
        return;
      }
      cancelRef.current = tweenScroll(y, ms, land, curve);
    };
    const msFor = (from, to) => Math.min(1500, Math.max(720, 520 + (Math.abs(to - from) / vh()) * 900));
    const goTo = (i, msOverride) => {
      const s = stops();
      if (!s.length || i < 0) return;
      if (i >= s.length) {
        // Past the last word: into the Mac (or the iPhone). No runway (the
        // flat fallback): the page stays on its last stop.
        const end = runAt(1);
        if (end == null) return;
        step = -1;
        glide(end + 2, msOverride ?? 2600);
        return;
      }
      const prev = step >= 0 ? step : nearest(s, window.scrollY);
      step = i;
      // Neighbouring stops can ask for their own pace (the logo and the
      // laptop take their time), in both directions.
      const paced = Math.abs(i - prev) === 1 ? (i > prev ? s[i].ms : s[prev].ms) : null;
      const via = i === prev + 1 ? s[i].via : null;
      // The career runs as one path only when it is set off from Me.
      const path = i === prev + 1 && !msOverride && s[prev]?.id === 'about' ? s[i].path : null;
      glide(s[i].y, msOverride ?? paced ?? msFor(window.scrollY, s[i].y), via, path);
    };
    const nearest = (s, y) => s.reduce((best, x, i) => (Math.abs(x.y - y) < Math.abs(s[best].y - y) ? i : best), 0);
    const inRange = (s, y) => stepping && s.length > 0 && y <= s[s.length - 1].y + 2;
    // Which stop to move from: the one the page is on or gliding to, else
    // wherever it is now.
    const next = (dir) => {
      const s = stops();
      const y = window.scrollY;
      if (step >= 0) return step + dir;
      if (dir > 0) {
        const i = s.findIndex((x) => x.y > y + 2);
        return i < 0 ? s.length : i;
      }
      for (let i = s.length - 1; i >= 0; i -= 1) if (s[i].y < y - 2) return i;
      return -1;
    };
    // Stops the journey plays on from by itself: Now (on to the logo), and
    // from the logo on, the Mac: it keeps drifting slowly through the words
    // and in, until a scroll moves it on faster.
    const drifts = (id) => id === 'logo' || id === 'mac' || id?.startsWith('chapter');
    const playsOn = (id) => id === 'now' || drifts(id);
    const playOn = () => {
      clearTimeout(autoTimer);
      autoGlide = false;
      const here = step >= 0 ? stops()[step] : null;
      if (!autoRef.current || !playsOn(here?.id)) {
        autoRef.current = false;
        return;
      }
      const tick = () => {
        if (!autoRef.current || gliding) return;
        // Not while nobody is watching, or the contact card is open.
        if (document.hidden || contactRef.current) {
          autoTimer = setTimeout(tick, 600);
          return;
        }
        autoGlide = true;
        if (drifts(here.id)) {
          // The slow drift: a long, even glide to the next stop (or, past the
          // last word, into the Mac), easing only a little at each word.
          const s = stops();
          const i = step + 1;
          const to = i < s.length ? s[i].y : runAt(1) + 2;
          const ms = i < s.length ? DRIFT_MS : DRIFT_MS * 1.4;
          step = i < s.length ? i : -1;
          glide(to, ms, null, [{ y: to, ms, curve: DRIFT.curve }]);
          return;
        }
        goTo(step + 1);
      };
      autoTimer = setTimeout(tick, here.id === 'now' ? AUTO_REST_NOW : here.id === 'logo' ? AUTO_REST_LOGO : drifts(here.id) ? 0 : AUTO_REST);
    };
    // A scroll, swipe or key: one stop, forward or back. Forward onto the
    // timeline sets it playing on; back stops it.
    const userGo = (dir) => {
      clearTimeout(autoTimer);
      // Forward while it plays on: on to where it was heading, quicker.
      const i = autoGlide && dir > 0 && step >= 0 ? step : next(dir);
      autoGlide = false;
      autoRef.current = dir > 0 && playsOn(stops()[i]?.id);
      goTo(i);
    };
    // A skip (or a jump of more than one stop) does not fast-forward through
    // everything in between: the page dips to its own colour for a beat,
    // lands on the stop, and comes back up there.
    const DARK_FROM = ['logo', 'mac'];
    const cut = (i) => {
      const s = stops();
      const target = s[i];
      const el = cutRef.current;
      if (!target || !el) {
        goTo(i);
        return;
      }
      cancelRef.current?.();
      clearTimeout(settleTimer);
      gliding = true;
      step = i;
      const dark = DARK_FROM.includes(target.id) || target.id.startsWith('chapter');
      el.style.background = dark ? '#07070a' : 'var(--paper)';
      el.style.transition = 'opacity 240ms ease';
      el.style.opacity = '1';
      setTimeout(() => {
        window.scrollTo(0, target.y);
        lastY = target.y;
        requestAnimationFrame(() => {
          el.style.transition = 'opacity 460ms ease';
          el.style.opacity = '0';
          gliding = false;
          playOn();
        });
      }, 250);
    };
    goToIdRef.current = (id, ms, opts = {}) => {
      clearTimeout(autoTimer);
      autoRef.current = false;
      // 'in': all the way into the Mac (or the iPhone).
      const s = stops();
      const i = id === 'in' ? s.length : s.findIndex((x) => x.id === id);
      if (i < 0) return;
      const from = step >= 0 ? step : nearest(s, window.scrollY);
      if (i < s.length && (opts.cut || Math.abs(i - from) > 1)) cut(i);
      else goTo(i, ms);
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (!deckRef.current || gliding || closingRef.current) {
        lastY = y;
        return;
      }
      if (Math.abs(y - lastY) >= vh() * 1.5) step = -1; // a jump (Home, a link)
      lastY = y;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (gliding || closingRef.current) return;
        const s = stops();
        const now = window.scrollY;
        if (!inRange(s, now)) {
          step = -1;
          return;
        }
        const i = nearest(s, now);
        step = i;
        autoRef.current = false; // dragged (the scrollbar): the visitor drives
        clearTimeout(autoTimer);
        if (Math.abs(s[i].y - now) > 2) glide(s[i].y, 480);
      }, 160);
    };

    const onWheel = (e) => {
      const t = e.timeStamp || performance.now();
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = sideways ? e.deltaX : e.deltaY;
      const mag = Math.abs(delta) * (e.deltaMode === 1 ? 16 : 1);
      const gap = t - last;
      // Gestures: a pause starts a new one; so does a clear surge in the
      // middle of the last one's coasting (a second swipe on top of it). A
      // gesture steps once, when it has travelled a real distance, so a
      // trackpad's coasting tail (tiny deltas, sometimes far apart) never
      // does. A gesture that overlaps a glide is spent.
      const surge = mag >= 12 && mag > prevMag * 1.5 + 4 && t - steppedAt > 1200;
      if (gap > 220 || surge) {
        gestureSum = 0;
        // (A glide it plays by itself is not one the visitor started.)
        gestureSpent = gliding && !autoGlide;
        gestureFirst = mag;
        // After a long pause (a mouse wheel click, a new swipe) it counts at
        // once; after a short one it must build up first, or it is the last
        // gesture's coasting resuming after a hiccup.
        gestureSure = gap > 600 || surge;
      }
      gestureSum += mag;
      if (mag > gestureFirst * 1.3 + 1) gestureSure = true;
      last = t;
      prevMag = mag;
      if (closingRef.current) {
        gestureSpent = true; // the swipe that pressed Shut Down is still coasting
        e.preventDefault();
        return;
      }
      // Nothing moves the page under a glide (it would cancel it); the
      // input that arrives meanwhile is dropped, not queued. Except turning
      // back while the timeline plays on: it stops and goes back at once.
      if (gliding) {
        // While it plays on by itself, a scroll takes over: back stops it and
        // goes back; forward moves it on to the next stop, quicker.
        if (autoGlide && !gestureSpent && gestureSure && gestureSum >= 30) {
          steppedAt = t;
          userGo(Math.sign(delta));
        }
        gestureSpent = true;
        e.preventDefault();
        return;
      }
      if (inRange(stops(), window.scrollY)) {
        e.preventDefault();
        if (!gestureSpent && gestureSure && gestureSum >= 30) {
          gestureSpent = true;
          steppedAt = t;
          userGo(Math.sign(delta));
        }
        return;
      }
      if (sideways && mag > 0.5) {
        e.preventDefault();
        window.scrollBy(0, e.deltaX * (e.deltaMode === 1 ? 16 : 1));
      }
    };

    const engaged = () => inRange(stops(), window.scrollY);
    const onTouchStart = (e) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e) => {
      if (closingRef.current || gliding || (touchY != null && engaged())) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      if (touchY == null || closingRef.current) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      if (Math.abs(dy) <= 24 || !engaged()) return;
      if (!gliding) userGo(Math.sign(dy));
      else if (autoGlide && dy < 0) userGo(-1);
    };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || closingRef.current || (!engaged() && !gliding)) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
      const fwd = ['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key);
      const back = ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key);
      if (!fwd && !back) return;
      e.preventDefault();
      if (!gliding) userGo(fwd ? 1 : -1);
      else if (autoGlide && back) userGo(-1);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(settleTimer);
      clearTimeout(autoTimer);
      autoRef.current = false;
      goToIdRef.current = null;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, phone, reduced]);

  // "Keep scrolling": armed by scrolling, cleared by the next scroll. Never
  // at the very top (the hero has its own cue), nor in the Mac's room.
  useEffect(() => {
    if (!loaded || closing || !active) return undefined;
    let t;
    const arm = () => {
      setIdle(false);
      clearTimeout(t);
      const roomTop = runwayRef.current ? runwayRef.current.offsetTop : maxScroll();
      // Not while the timeline plays on by itself: nothing to prompt.
      t = setTimeout(() => setIdle(!autoRef.current && window.scrollY > 4 && window.scrollY < roomTop - 4), IDLE_HINT_MS);
    };
    window.addEventListener('scroll', arm, { passive: true });
    return () => {
      window.removeEventListener('scroll', arm);
      clearTimeout(t);
      setIdle(false);
    };
  }, [loaded, closing, active]);

  // The end of the story (the logo and its line, then the laptop): a click or
  // tap anywhere goes in.
  const [endOn, setEndOn] = useState(false);
  useMotionValueEvent(nowT, 'change', (t) => {
    const on = t >= END_FROM && t < 1;
    setEndOn((cur) => (cur === on ? cur : on));
    if (t > 0.8) markJourneyDone();
  });
  const enter = useCallback(() => {
    playShutter({ level: 0.5 });
    if (!use3D && !phone) {
      onReachScreen?.();
      return;
    }
    goToIdRef.current?.('in', 4200);
  }, [use3D, onReachScreen, phone]);

  // The hero's Scroll button: on to About, like a scroll.
  const scrollToAbout = useCallback(() => {
    goToIdRef.current?.('about');
  }, []);

  // The laptop comes up under the page as it dissolves (a cross-dissolve),
  // once the logo is already sitting where the lid's will be.
  const nowY = useCallback((t) => {
    const deck = deckRef.current;
    if (!deck) return 0;
    const travel = deck.offsetHeight - window.innerHeight;
    return deck.offsetTop + travel * (SPAN.now[0] + (SPAN.now[1] - SPAN.now[0]) * t);
  }, []);
  const sceneFadeFrom = useCallback(() => nowY(0.4), [nowY]);
  // The 3D renders only from here on: the logo starts heading for the lid at
  // 0.33. Before that it would draw every frame, unseen, under the timeline.
  const liveFrom = useCallback(() => nowY(0.22), [nowY]);
  const sceneFadeTo = useCallback(() => nowY(0.8), [nowY]);

  const flat = !use3D && !phone;

  return (
    <section className={styles.journey} style={paletteStyle(palette)} data-dark={dark ? 'true' : undefined} aria-label="Introduction">
      <MacRoom
        runwayRef={runwayRef}
        use3D={use3D}
        setUse3D={setUse3D}
        reduced={reduced}
        active={active}
        mode={mode}
        onReachScreen={onReachScreen}
        onClosed={handleClosed}
        poses={FLOW_POSES}
        sway={false}
        wordsOnTop
        arrive="fade"
        sceneFadeFrom={sceneFadeFrom}
        sceneFadeTo={sceneFadeTo}
        liveFrom={liveFrom}
        logoRef={logoRef}
      />

      {/* The Mac room is drawn for the eye only; what Ken does, for everyone. */}
      <ul className={styles.srOnly} aria-label="What I do">
        {SERVICES.map((sv) => (
          <li key={sv.id}>
            {sv.name}: {sv.items.map((it) => it.label).join(', ')}
          </li>
        ))}
      </ul>

      <header className={styles.bar}>
        <Scoreboard progress={progress} alpha={scoreAlpha} unlocked={returning} goTo={(id) => goToIdRef.current?.(id)} />
        <nav className={styles.barLinks} aria-label="Quick links">
          {/* Straight to the work, for anyone who wants proof first. */}
          <button type="button" className={styles.barLink} onClick={onSkip}>
            See the work
          </button>
          <button type="button" className={styles.hire} onClick={() => setContactOpen(true)}>
            <i aria-hidden />
            Work with me
          </button>
        </nav>
      </header>

      <div className={styles.page}>
        <div ref={deckRef} className={styles.deck} style={{ height: `${TOTAL + 100}vh` }}>
          <div ref={stickyRef} className={styles.deckSticky}>
            <motion.div className={styles.paperBg} style={{ opacity: paperOpacity }} aria-hidden />
            {/* The hero's print grain, carried on in the paper under About and
                the timeline, so the whole story is one printed sheet. */}
            <motion.span className={styles.paperGrain} style={{ opacity: paperGrain }} aria-hidden />
            <motion.div className={`${styles.grid} ${lines[0] || aboutInstant ? styles.gridOn : ''}`} style={{ opacity: gridOpacity }} aria-hidden>
              <motion.div
                className={styles.gridLines}
                style={{ backgroundSize: gridSize, backgroundPosition: gridPosition }}
              />
            </motion.div>

            <Panel progress={progress} exit="hero>ab" exitAxis={wide ? 'x' : 'y'} reduced={reduced} className={styles.heroPanel} aria-label="Ken">
              <Hero />
            </Panel>

            <Panel progress={progress} enter="hero>ab" enterAxis={wide ? 'x' : 'y'} exit="ab>tl" exitAxis={wide ? 'x' : 'y'} reduced={reduced} className={`${styles.aboutPanel} ${wide ? styles.aboutWide : ''}`} aria-label="About">
              <MePanel progress={progress} span={meSpan} arrive={SPAN['hero>ab']} instant={aboutInstant} wide={wide} onSeeWork={onSkip} />
            </Panel>

            {/* It slides in under the ball, which holds the middle. */}
            <Panel progress={progress} enter="ab>tl" reduced={reduced} className={styles.timelinePanel} aria-label="Career timeline">
              <TimelineC progress={tlProgress} fade={tlFade} retract={rewind} handoff={handoff} />
              <AnimatePresence>
                {inCareer && (
                  <motion.button
                    type="button"
                    className={`${styles.note} ${styles.noteOn} ${styles.skipCareer}`}
                    onClick={() => goToIdRef.current?.('logo', undefined, { cut: true })}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <span>skip career</span>
                    <svg viewBox="0 0 90 30" aria-hidden>
                      <path pathLength="1" d="M4 16C30 10 56 12 82 16" />
                      <path pathLength="1" d="M72 7l11 9-11 8" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </Panel>

            <Cast
              progress={progress}
              go={loaded || closing}
              instant={closing}
              reduced={reduced}
              phone={phone}
              rootRef={stickyRef}
              tg={tg}
              onScrollOn={scrollToAbout}
              nameStyle={palette.name}
            />


            <motion.div className={styles.storyLineWrap} style={{ opacity: lineOpacity, color: lineColor }}>
              <RiseWords text={phone ? STORY_LINE_PHONE : STORY_LINE} reveal={lineReveal} className={styles.bridgeLine} />
              <motion.p className={styles.bridgeSub} style={{ opacity: subOpacity, y: subY }}>
                {phone ? STORY_SUB_PHONE : STORY_SUB}
              </motion.p>
              {flat && (
                <button type="button" className={styles.btnLight} onClick={() => onReachScreen?.()}>
                  See my work
                </button>
              )}
            </motion.div>

            {/* Ten years wound into one dot, which opens into the lid's own
                Apple logo and settles onto it as the MacBook comes up. */}
            <motion.svg
              className={styles.logo}
              viewBox={`${APPLE_BOX.x} ${APPLE_BOX.y} ${APPLE_BOX.w} ${APPLE_BOX.h}`}
              style={{ width: LOGO_EL_W, height: LOGO_EL_H, transform: logoTransform, opacity: logoOpacity, clipPath: logoClip }}
              aria-hidden
            >
              <defs>
                <linearGradient id="kenChrome" x1="0" y1="0" x2="0.35" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.46" stopColor="#e4e6ea" />
                  <stop offset="0.54" stopColor="#a9aeb6" />
                  <stop offset="1" stopColor="#f4f5f7" />
                </linearGradient>
              </defs>
              {/* The lid's own colour, under the chrome: it comes in with the
                  chrome (so the ball, not a dark dot, is what opens) and is
                  what is left when the chrome dims onto the lid. */}
              <motion.path fill={LID_LOGO_FILL} d={APPLE_PATH} style={{ opacity: inkOpacity }} />
              <motion.path fill="url(#kenChrome)" d={APPLE_PATH} style={{ opacity: whiteOpacity }} />
            </motion.svg>

            {endOn && (
              <button type="button" className={styles.enter} onClick={enter} aria-label="See my work" />
            )}

          </div>
        </div>
        {phone ? <PhoneEnding onReach={onReachScreen} innerRef={runwayRef} /> : !flat && <div ref={runwayRef} className={styles.runway} aria-hidden />}
      </div>

      {/* At the end of the story only: the ball does the asking before that. */}
      <div className={`${styles.idleHint} ${idle && endOn && !contactOpen ? styles.idleHintOn : ''}`} aria-hidden>
        <span>{phone ? 'Swipe up' : 'Scroll down'}</span>
        <i />
      </div>

      {/* A skip dips through this for a beat (see cut). */}
      <div ref={cutRef} className={styles.cut} aria-hidden />

      {SHOW_SWATCHES && !dark && (
        <Swatches
          current={palette.id}
          onPick={(p) => {
            savePalette(p.id);
            setPalette(p);
          }}
        />
      )}
      {!loaded && <Loader reduced={reduced} onDone={onLoaded} withModel={use3D} />}
      <BriefSheet open={contactOpen} onClose={() => setContactOpen(false)} onSeeWork={enter} style={paletteStyle(palette)} />
    </section>
  );
}
