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
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import BriefSheet from '../../Brief/BriefSheet.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { tintChapters } from '../../Intro3/timeline.js';
import { SERVICES } from '../../../data/services.js';
import { playSwish, preloadShutter, preloadSwish } from './sfx.js';
import DotField, { addRipple } from './DotField.jsx';
import MacRoom from '../MacRoom.jsx';
import TimelineC, { TIMELINE_NOW, TIP_R, timelineBallAt, timelineSpinAt, timelineDrift, timelineGrid, timelineLayout, timelineStops } from './TimelineC.jsx';
import PhoneEnding, { PHONE_STOPS, phoneLogoPoint } from './PhoneEnding.jsx';
import MePanel, { ABOUT_BEAT } from './MePanel.jsx';
import Ball3D from './Ball3D.jsx';
import ChromeLogo from './ChromeLogo.jsx';
import useClock from '../../../hooks/useClock.js';
import { PALETTES, paletteStyle, readPalette, savePalette } from './palette.js';
import styles from './JourneyC.module.css';

const EASE = [0.16, 1, 0.3, 1];
// Same file the 3D rig loads (kept as a literal so this chunk stays free of three.js).
const MODEL_SRC = '/models/macbook-rigged.glb';

// Overhead, from the front: the closed laptop as if on your desk, its lid's
// logo upside down (as on a real MacBook; the chrome logo's spin lands it
// so). The camera never turns or tilts: opening it, it only eases in a
// little, then the dive goes into the screen.
// Beat 2 starts close on the lid's logo (the 3D scene points this pose at
// the lid once it has loaded, see World's LogoAnchor) and pulls straight
// back, along the same line, to the closed laptop overhead.
const CLOSE_ON_LOGO = { yaw: 0, pitch: 0.95, radius: 7.2, target: new THREE.Vector3(0, 0, 0), onLid: true };
// (Aimed a little behind the logo, toward the hinge, so the laptop rests
// low on the screen, under the words.)
const OVERHEAD = { yaw: 0, pitch: 0.95, radius: 13.5, target: new THREE.Vector3(0, 0, 0), fromLid: [0, 0, -1.15] };
const FLOW_POSES = { hero: CLOSE_ON_LOGO, front: OVERHEAD };
// The runway after the deck (MacRoom's progress): the pull-back reveal, then
// (beat 3) the lid opens over the words, the screen wakes, the camera dives in.
const MAC_BEATS = { orbit: [0, 0.34], lid: [0.46, 0.74], wake: [0.58, 0.78], dive: [0.8, 0.97] };

// HERO ART: Ken, drawn from his own photos (flat shapes, print grain), on a
// transparent background. `aspect` is the file's width / height.
const HERO_ART = { src: '/assets/hero/art/ken.webp', aspect: 832 / 2138 };

// The loader: his name printed in outline, filling with ink from the bottom
// as the real loading comes in, the count beside it.
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
        // Full: a beat on the inked name, then the paper is the hero's.
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
      {/* His name in outline, the ink rising in it with the loading. */}
      <div className={styles.fillName} style={{ '--fill': shown.toFixed(4) }} aria-hidden>
        <span className={styles.fillOutline}>KEN</span>
        <span className={styles.fillInk}>KEN</span>
      </div>
      <p className={styles.clock} aria-hidden>
        {pct}%
      </p>
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
// The hero's set: a designer's canvas. A dot grid, rulers along the top and
// left, as in a design tool.
const RULER_STEP = 100; // px between numbered ticks

function Canvas({ on }) {
  const [w, setW] = useState(() => window.innerWidth);
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => {
    const r = () => {
      setW(window.innerWidth);
      setH(window.innerHeight);
    };
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const across = Array.from({ length: Math.floor(w / RULER_STEP) }, (_, i) => (i + 1) * RULER_STEP);
  const down = Array.from({ length: Math.floor(h / RULER_STEP) }, (_, i) => (i + 1) * RULER_STEP);
  return (
    <div className={`${styles.canvas} ${on ? styles.canvasOn : ''}`} aria-hidden>
      <div className={styles.rulerTop}>
        {across.map((x) => (
          <span key={x} style={{ left: x }}>
            {x}
          </span>
        ))}
      </div>
      <div className={styles.rulerLeft}>
        {down.map((y) => (
          <span key={y} style={{ top: y }}>
            {y}
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero({ on }) {
  const time = useClock(localTime);
  return (
    <div className={styles.hero}>
      <Canvas on={on} />
      <p className={styles.place}>
        <span>India</span>
        <span>{time}</span>
      </p>
      <h1 className={styles.srOnly}>
        Hi, I&apos;m Kenneth Nathanael. {DESCRIPTOR}
      </h1>
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
    // Where the ball waits beside About, on the floor.
    rest: { x: vw * 0.4, y: vh - 22 },
  };
}

const PUSH = 0.07;
// The ball. In the hero it rolls out from behind his legs and comes to rest
// just past his right shoe. Into About it is knocked up in one arc onto
// Videos' line and bounces there, each bounce bringing the next piece
// (kickAt, bounceAt); into the career it is shot through a hoop onto the
// career's line (hoopShotAt).
// BALL is its size in units of his height in the hero.
// ROLL_K: how much it turns for the ground covered (a quarter of a true
// roll, so it rolls without whirling).
const BALL = 0.115;
const BALL_IN = { delay: 2500, ms: 1900 };
const BALL_REST_Y = 0.977; // its base on his floor, in units of his height
const ROLL_K = 0.25;

// The bounces on the line, after the shot into the career.
const BOUNCES = 3;

// Hero to About: as Ken and his name rise away, the ball is knocked up off
// his floor in one arc (true gravity, `f` is time over the glide) and comes
// down on Videos' line. There it bounces six times, each lower and quicker
// (`e` of the last), on its own clock; each hit brings the next piece of
// About (see MePanel's beat) and sends a ripple through the dots.
const KICK = { apex: 0.12 }; // the arc's top, a share of vh
const BOUNCE = { first: 0.62, e: 0.74, n: 6, h: 0.2 }; // s, of the last, hits, first height (share of vh)

function kickAt(f, { x0, y0, x1, y1, vh }) {
  const apexY = vh * KICK.apex;
  const k1 = Math.sqrt(Math.max(1, y0 - apexY));
  const k2 = Math.sqrt(Math.max(1, y1 - apexY));
  const tUp = k1 / (k1 + k2);
  const g = 2 * (k1 + k2) ** 2;
  const y = y0 - g * tUp * f + (g * f * f) / 2;
  return { x: x0 + (x1 - x0) * f, y, speed: Math.abs(g * (f - tUp)) / g };
}

/** On Videos' line, `t` s after it landed: its height, its squash (stretch
 *  when < 0), and how many times it has hit (1 on landing, up to n). */
function bounceAt(t, vh) {
  const g = (8 * BOUNCE.h * vh) / BOUNCE.first ** 2;
  let at = 0;
  for (let k = 1; k <= BOUNCE.n; k += 1) {
    const d = BOUNCE.first * BOUNCE.e ** (k - 1);
    const s = t - at;
    if (k === BOUNCE.n && s >= d) break;
    if (s < d) {
      const lift = (g * s * (d - s)) / 2;
      const speed = Math.abs(g * (d / 2 - s));
      const hit = BOUNCE.e ** (k - 1) * Math.max(0, 1 - s / 0.08);
      // Stretched along the way it moves, more the faster.
      const stretch = 0.14 * Math.min(1, speed / (g * BOUNCE.first * 0.5)) * BOUNCE.e ** (k - 1);
      return { lift, squash: hit > 0.02 ? hit : -stretch, hits: k, since: s };
    }
    at += d;
  }
  return { lift: 0, squash: 0, hits: BOUNCE.n, since: t - at };
}

// About to the career, as shares of its beat. About fades; the hoop drops in
// from above, swinging a little on its way to stillness; the ball takes one
// true shot (constant gravity, constant size) up into it; nothing but net
// (a swish); the net lets it go and the camera tilts down after it (the hoop
// up and away, the timeline up from below) until it lands on the line and
// bounces, turning to chrome. Each thing has the stage to itself.
const HOOP_SHOT = {
  out: [0, 0.14], // About fades
  hoopIn: [0.06, 0.3], // the hoop drops in and settles
  crouch: [0.18, 0.24], // the ball dips before it goes
  launch: 0.24, // it leaves Videos
  rim: 0.56, // through the rim
  netOut: 0.62, // out of the net's foot
  tilt: [0.62, 0.84], // the hoop away, the timeline in
  land: 0.86, // on the line
  apex: 0.12, // the top of the arc, a share of vh
  rimY: 0.32, // the rim, a share of vh
  e: 0.36, // each bounce on the line, of the last
};
const HOOP_STAGE = 0.3; // the hoop's size, a share of vh
// The bounces on the line: [how long, how high (a share of vh)] each.
const LINE_BOUNCES = [
  [0.055, 0.05],
  [0.035, 0.018],
  [0.02, 0.006],
];
const NET_FOOT = 46 / 120; // the net's foot below the rim, a share of the hoop

function hoopShotAt(b, { x0, y0, cx, vh, yL }) {
  const S = HOOP_SHOT;
  const rimY = vh * S.rimY;
  const apexY = vh * S.apex;
  const netY = rimY + vh * HOOP_STAGE * NET_FOOT;
  const tilt = smooth01(within(b, S.tilt)) * vh;
  const T = S.rim - S.launch;
  const k1 = Math.sqrt(Math.max(1, y0 - apexY));
  const k2 = Math.sqrt(Math.max(1, rimY - apexY));
  const g = (2 * (k1 + k2) ** 2) / (T * T);
  const tUp = (T * k1) / (k1 + k2);
  const base = { rimT: S.rim, squash: 0, hits: 0, down: 0 };
  if (b <= S.launch) {
    // Gathering itself: a little squat, then up.
    const c = within(b, S.crouch);
    return { ...base, x: x0, y: y0, air: 0, squash: Math.sin(Math.PI * c) * 0.5 };
  }
  if (b < S.rim) {
    const t = b - S.launch;
    return { ...base, x: x0 + (cx - x0) * (t / T), y: y0 - g * tUp * t + (g * t * t) / 2, air: t / T, squash: -0.1 * Math.max(0, 1 - t / 0.05) };
  }
  if (b < S.netOut) {
    // The net takes its speed: it sinks through to the net's foot.
    return { ...base, x: cx, y: rimY + (netY - rimY) * outQuad(within(b, [S.rim, S.netOut])), air: 1 };
  }
  // Let go, it falls (one gravity) while the camera tilts down after it,
  // so on screen it comes down gently onto the line.
  const T3 = S.land - S.netOut;
  const fall = yL + vh - netY; // the line is a screen below, in the world
  const g3 = (2 * fall) / (T3 * T3);
  const shrink = smooth01(within(b, [S.netOut, S.land]));
  if (b < S.land) {
    const t = b - S.netOut;
    return { ...base, x: cx, y: netY + (g3 * t * t) / 2 - tilt, air: 1, down: shrink };
  }
  // On the line: three bounces, each lower and quicker, all done well
  // before the beat ends (so the ball is never left in the air on the line).
  let y = yL;
  let squash = 0;
  let hits = 0;
  let at = S.land;
  LINE_BOUNCES.forEach(([d, h], n) => {
    const t = b - at;
    if (t >= 0) squash = Math.max(squash, S.e ** n * Math.max(0, 1 - t / 0.02));
    hits += smooth01(within(b, [at, at + 0.025]));
    if (t >= 0 && t < d) y = yL - 4 * h * vh * (t / d) * (1 - t / d);
    at += d;
  });
  return { ...base, x: cx, y, air: 1, down: 1, squash, hits };
}

/** Where the hoop hangs over the shot: dropped in from above on a short
 *  cable, swinging to rest; up and away as the camera tilts. */
function hoopAt(b, vh) {
  const k = within(b, HOOP_SHOT.hoopIn);
  const drop = (1 - outQuad(Math.min(1, k * 1.6))) * vh * 0.7;
  const swing = 7 * Math.exp(-4 * k) * Math.sin(k * Math.PI * 3.2) * (k > 0 ? 1 : 0);
  const tilt = smooth01(within(b, HOOP_SHOT.tilt)) * vh;
  return { y: -drop - tilt, rot: swing, on: b > HOOP_SHOT.hoopIn[0] && b < HOOP_SHOT.tilt[1] };
}

// The net as the ball drops through it: it stretches down, then shivers back.
function swishAt(b, rimT) {
  const d = b - rimT;
  if (d < -0.012) return 0;
  if (d < 0.03) return smooth01((d + 0.012) / 0.042);
  return Math.exp(-(d - 0.03) / 0.05) * Math.cos((d - 0.03) * 70);
}
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

// The hoop for the shot into the career, drawn in ink like the rest of the
// page, in two layers so the ball drops through it: the backboard and the
// back of the rim behind the ball, the front of the rim and the net in front.
// Cast places both and sets --swish on the net.
function HoopBack({ hoopRef }) {
  return (
    <div ref={hoopRef} className={styles.hoop} aria-hidden>
      <svg viewBox="0 0 120 120">
        <rect className={styles.board} x="14" y="-34" width="92" height="58" rx="3" />
        <rect className={styles.board} x="42" y="-6" width="36" height="24" rx="1" />
        <path className={styles.rim} d="M28 30a32 7 0 0 1 64 0" />
      </svg>
    </div>
  );
}

// The net's strings, from the rim (y 30) down to its narrower foot.
const NET = (() => {
  const top = (i) => 28 + (64 * i) / 6;
  const foot = (i) => 42 + (36 * i) / 6;
  const d = [];
  for (let i = 0; i <= 6; i += 1) d.push(`M${top(i).toFixed(1)} 31L${foot(i).toFixed(1)} 76`);
  // The diamond mesh: each string to its neighbour's next knot.
  for (let i = 0; i < 6; i += 1) {
    d.push(`M${top(i).toFixed(1)} 31L${((top(i + 1) + foot(i + 1)) / 2).toFixed(1)} 53.5`);
    d.push(`M${top(i + 1).toFixed(1)} 31L${((top(i) + foot(i)) / 2).toFixed(1)} 53.5`);
  }
  return d.join('');
})();

function HoopFront({ hoopRef }) {
  return (
    <div ref={hoopRef} className={styles.hoop} aria-hidden>
      <svg viewBox="0 0 120 120">
        <path className={styles.net} d={NET} />
        <path className={styles.rim} d="M28 30a32 7 0 0 0 64 0" />
      </svg>
    </div>
  );
}

// The way on: a label on the page, its arrow pointing down.
function ScrollNote({ noteRef, onClick }) {
  return (
    <button ref={noteRef} type="button" className={`${styles.note} ${styles.noteScroll}`} onClick={onClick}>
      <span>scroll down</span>
      <svg viewBox="0 0 40 70" aria-hidden>
        <path pathLength="1" d="M20 4V62" />
        <path pathLength="1" d="M10 52l10 10 10-10" />
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

// The poster, remixed: where the visitor has moved and sized the name in
// edit mode (offsets as shares of the viewport, so it holds on resize).
const POSE_KEY = 'ken:poster-pose';
const readPose = () => {
  try {
    const p = JSON.parse(localStorage.getItem(POSE_KEY) || 'null');
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.s)) return p;
  } catch {
    /* none kept */
  }
  return { x: 0, y: 0, s: 1 };
};
const savePose = (p) => {
  try {
    localStorage.setItem(POSE_KEY, JSON.stringify(p));
  } catch {
    /* private mode: it lasts for this visit */
  }
};
// How close (px) the name has to come to a guide to snap to it.
const SNAP = 8;
const SCALE_MIN = 0.55;
const SCALE_MAX = 1.45;

function Cast({ progress, go, reduced, instant, phone, rootRef, tg, onScrollOn, nameStyle = 'riso', editing = false, apiRef }) {
  const figRef = useRef(null);
  const nameRef = useRef(null);
  const ballRef = useRef(null);
  const ball3dRef = useRef(null);
  const sizeRef = useRef(null);
  // Edit mode: the pose it eases to (target) and the one drawn (cur), in
  // shares of the viewport; the guides shown while dragging.
  const poseRef = useRef(null);
  if (!poseRef.current) {
    const p = readPose();
    poseRef.current = { target: { ...p }, cur: { ...p }, live: false };
  }
  const guideVRef = useRef(null);
  const guideHRef = useRef(null);
  const hoopBackRef = useRef(null);
  const hoopFrontRef = useRef(null);
  const noteRef = useRef(null);
  const [L, setL] = useState(() => castLayout(phone));
  useEffect(() => {
    const on = () => setL(castLayout(phone));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [phone]);

  // The selection's size label: the name's real box, as the tool would say.
  useEffect(() => {
    let live = true;
    const put = () => {
      const box = sizeRef.current?.parentElement;
      if (live && box && sizeRef.current) sizeRef.current.textContent = `${box.offsetWidth} × ${box.offsetHeight}`;
    };
    (document.fonts?.ready ?? Promise.resolve()).then(put);
    put();
    return () => {
      live = false;
    };
  }, [L]);

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
  // The ball's drop onto About's four (its own clock, started once they are
  // all in), where it rests (its spot), and the shot's progress last frame.
  const dropRef = useRef({ landAt: null, spot: null, b: 0, hits: 0 });
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
        // The visitor's remix, eased to (or followed exactly while dragging).
        const pose = poseRef.current;
        const { target: pt, cur: pc } = pose;
        const k = pose.live ? 1 : 0.18;
        pc.x += (pt.x - pc.x) * k;
        pc.y += (pt.y - pc.y) * k;
        pc.s += (pt.s - pc.s) * k;
        const nx = -p.sx * 14 * depth + pc.x * vw;
        const ny = -a * vh - p.sy * 8 * depth + pc.y * vh;
        const ns = (1 + (push - 1) * 0.3) * pc.s;
        if (sizeRef.current && editing) {
          const label = `${Math.round(name.offsetWidth * ns)} × ${Math.round(name.offsetHeight * ns)}`;
          if (sizeRef.current.textContent !== label) sizeRef.current.textContent = label;
        }
        put(name, 'ntf', 'transform', `translate3d(${nx.toFixed(1)}px, ${ny.toFixed(1)}px, 0) translateX(-50%) scale(${ns.toFixed(4)})`);
      }

      // The camera on him. The hero holds his feet in place (the push grows
      // him upwards); About holds his chest, closer.
      const w = H * HERO_ART.aspect;
      const camAt = (aa) => {
        const px = 0.5;
        const py = 1;
        const S = push;
        let qx = L.hero.x;
        let qy = L.hero.y;
        // Me is the words alone: he rises away with the hero's page and his name.
        qy -= aa * vh;
        qx += p.sx * 12 * depth;
        qy += p.sy * 8 * depth + (1 - shown) * 24;
        return { left: qx - px * w * S, top: qy - py * H * S, S };
      };
      const cam = camAt(a);

      // The ball: it rolls out from behind his legs to the bottom right.
      // Into Me it rolls along the bottom of the screen (no bounce); into
      // the career it is shot up and over, drops through the net and lands
      // on the line, bouncing, turning to chrome as it does. At the end
      // of the career it opens into the Apple logo.
      const ball = ballRef.current;
      const b3 = ball3dRef.current;
      let rimT = 1; // when the shot drops through the rim (for the net)
      let noteX = null; // "scroll down" sits just right of the resting ball
      if (ball) {
        const h0 = camAt(0);
        const heroD = H * BALL * h0.S;
        const knobD = TIP_R * 2;
        const startX = h0.left + (w * h0.S) / 2; // behind his legs
        const heroX = h0.left + w * h0.S * 0.9 + heroD / 2; // just past his right shoe
        noteX = heroX + heroD / 2 + 36;
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
        let chrome = 0;
        let seams = 1;
        let squash = 0;
        let seen = t0 != null && enter > 0;
        // About's spot for it: Videos' hairline.
        const st = dropRef.current;
        const b = a >= 1 ? within(v, SPAN['ab>tl']) : 0;
        const spotEl = document.querySelector('[data-ball-spot]');
        if (b <= 0 && spotEl) {
          const r = spotEl.getBoundingClientRect();
          st.spot = { x: r.left + Math.min(r.width * 0.42, 150), y: r.top - heroD / 2 };
        }
        const spot = st.spot ?? { x: heroX, y: floorY };
        const f = within(v, KICK_SPAN);
        // The beat About is on: how many times the ball has hit Videos.
        let hits = 0;
        if (f > 0 && f < 1 && !reduced) {
          // Knocked up off his floor as he leaves, in one arc onto Videos.
          const k = kickAt(f, { x0: heroX, y0: floorY, x1: spot.x, y1: spot.y, vh });
          x = k.x;
          y = k.y;
          rz += f * 9;
          squash = f < 0.05 ? -0.12 : -0.1 * Math.min(1, k.speed * 2);
          st.landAt = null;
        } else if (f >= 1 && b <= 0) {
          if (st.landAt == null) st.landAt = now - (reduced || instant ? 1e5 : 0);
          const bb = reduced ? { lift: 0, squash: 0, hits: BOUNCE.n, since: 1 } : bounceAt((now - st.landAt) / 1000, vh);
          x = spot.x;
          y = spot.y - bb.lift;
          squash = bb.squash;
          hits = bb.hits;
          rz += 9;
          // Videos gives a little under each hit.
          const li = spotEl?.closest('li');
          if (li) put(li, 'hit', '--hit', (bb.since < 0.18 && bb.lift < 2 ? 6 * BOUNCE.e ** (bb.hits - 1) * Math.sin(Math.PI * (bb.since / 0.18)) : 0).toFixed(2));
        } else if (b > 0) {
          hits = BOUNCE.n;
        }
        if (f <= 0) st.landAt = null;
        // Each new hit: the next piece of About, and a ripple through the dots.
        if (hits !== st.hits) {
          if (hits > st.hits && hits <= BOUNCE.n && b <= 0) addRipple(spot.x, spot.y + heroD / 2, 16 * BOUNCE.e ** (hits - 1));
          st.hits = hits;
          window.dispatchEvent(new CustomEvent(ABOUT_BEAT, { detail: hits }));
        }
        if (b > 0) {
          // Into the career: the shot, through the hoop, onto the line.
          const s = reduced
            ? b < 0.5
              ? { x: spot.x, y: spot.y, air: 0, down: 0, squash: 0, hits: 0, rimT: 1 }
              : { x: cx, y: cy, air: 1, down: 1, squash: 0, hits: BOUNCES, rimT: 1 }
            : hoopShotAt(b, { x0: spot.x, y0: spot.y, cx, vh, yL: cy });
          x = s.x;
          y = s.y;
          rimT = s.rimT;
          // Its own size all the way up and in; the knob's as it lands.
          size = heroD * (1 - s.down) + knobD * s.down;
          floor = 1 - smooth01(s.air * 4);
          // Orange to chrome, a step with every bounce.
          chrome = s.hits / BOUNCES;
          squash = s.squash;
          // Backspin on the way up and over.
          rz += 9 + s.air * 7;
        }
        // Nothing but net.
        if (!reduced && st.b < HOOP_SHOT.rim && b >= HOOP_SHOT.rim && b - st.b < 0.2) playSwish();
        st.b = b;
        if (v >= SPAN.tl[0]) {
          const rr = 0;
          const pp = v >= SPAN.now[0] ? TIMELINE_NOW : within(v, SPAN.tl) * TIMELINE_NOW;
          rz -= (((timelineSpinAt(tg, pp) - timelineSpinAt(tg, 0)) * Math.PI) / 180) * ROLL_K + rr * 3;
          // Wound in, it becomes the logo: the logo is born as this same
          // chrome ball, same place, same size, the same frame it goes.
          seen = !reduced && within(v, SPAN.now) < REWIND[1];
          chrome = 1;
          // Its channels melt away as the line winds in: a plain mirror ball
          // is what becomes the logo.
          seams = 1 - smooth01(within(within(v, SPAN.now), REWIND));
        }
        put(ball, 'bop', 'opacity', seen ? fade.toFixed(3) : '0');
        if (seen) {
          const r = size / 2;
          // Squashed flat for a moment where it hits; stretched (squash < 0)
          // as it falls fast.
          const sq = Math.abs(squash) > 0.001 ? ` scale(${(1 + 0.22 * squash).toFixed(3)}, ${(1 - 0.22 * squash).toFixed(3)})` : '';
          put(ball, 'btf', 'transform', `translate3d(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px, 0)${sq}`);
          put(ball, 'bw', 'width', `${size.toFixed(1)}px`);
          put(ball, 'bh', 'height', `${size.toFixed(1)}px`);
          put(ball, 'bfloor', '--floor', floor.toFixed(3));
          b3?.set(size, rz, 0, chrome, seams);
        }
      }

      // The hoop, at the top of the screen for the shot: it fades in where
      // it hangs, the net swishes as the ball drops through, and it fades
      // out where it hung as the ball lands (before the first role rises in
      // under it).
      const hb = hoopBackRef.current;
      const hf = hoopFrontRef.current;
      if (hb && hf) {
        // The hoop, on a stage of its own, in the middle: it drops in from
        // above and swings still, and goes up as the camera tilts down.
        const b2 = a >= 1 && !reduced ? within(v, SPAN['ab>tl']) : 0;
        const ho = hoopAt(b2, vh);
        const k = ho.on ? 1 : 0;
        put(hb, 'hop', 'opacity', String(k));
        put(hf, 'hop2', 'opacity', String(k));
        if (k > 0) {
          // The rim (y 30 of the drawing's 120) on the shot's rim line.
          const hs = vh * HOOP_STAGE;
          const tf = `translate3d(${(vw / 2 - hs / 2).toFixed(1)}px, ${(vh * HOOP_SHOT.rimY - hs * 0.25 + ho.y).toFixed(1)}px, 0) rotate(${ho.rot.toFixed(2)}deg)`;
          put(hb, 'htf', 'transform', tf);
          put(hf, 'htf2', 'transform', tf);
          put(hb, 'hsz', 'width', `${hs.toFixed(1)}px`);
          put(hf, 'hsz2', 'width', `${hs.toFixed(1)}px`);
          put(hf, 'hsw', '--swish', swishAt(b2, rimT).toFixed(3));
        }
      }

      // "scroll down": once the ball has come to rest, gone with the first scroll.
      const note = noteRef.current;
      if (note && noteX != null && wide) put(note, 'nx', 'left', `${noteX.toFixed(0)}px`);
      if (note) {
        const noteOn = a === 0 && (reduced || instant || since > BALL_IN.delay + BALL_IN.ms * 0.7);
        put(note, 'nop2', 'opacity', noteOn ? '1' : (1 - clamp01(a / 0.12)).toFixed(3));
        put(note, 'nev', 'pointerEvents', a < 0.05 ? 'auto' : 'none');
        if (noteOn && !note.classList.contains(styles.noteOn)) note.classList.add(styles.noteOn);
        if (a > 0.3 && note.classList.contains(styles.noteOn)) note.classList.remove(styles.noteOn);
      }

      // Gone with About: nothing to draw until the page comes back up.
      if (a >= 1) {
        put(fig, 'op', 'opacity', '0');
        return;
      }
      const tf = `translate3d(${cam.left.toFixed(1)}px, ${cam.top.toFixed(1)}px, 0) scale(${cam.S.toFixed(4)})`;
      put(fig, 'op', 'opacity', shown.toFixed(3));
      put(fig, 'tf', 'transform', tf);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [L, progress, reduced, instant, rootRef, tg, editing]);

  // Edit mode: drag the name (it snaps to the middle, the thirds and the
  // margins, and says so with a guide), drag its corner to size it.
  const gutter = () => Math.max(40, L.vw * 0.04);
  const showGuides = (gx, gy) => {
    const v = guideVRef.current;
    const h = guideHRef.current;
    if (v) {
      v.style.opacity = gx == null ? '0' : '1';
      if (gx != null) v.style.transform = `translateX(${gx.toFixed(1)}px)`;
    }
    if (h) {
      h.style.opacity = gy == null ? '0' : '1';
      if (gy != null) h.style.transform = `translateY(${gy.toFixed(1)}px)`;
    }
  };
  const onNameDown = (e) => {
    if (!editing || e.button !== 0) return;
    const name = nameRef.current;
    if (!name) return;
    e.preventDefault();
    const corner = e.target.closest?.('[data-corner]');
    const pose = poseRef.current;
    const start = { ...pose.target };
    const sx0 = e.clientX;
    const sy0 = e.clientY;
    const w0 = name.offsetWidth;
    const h0 = name.offsetHeight;
    pose.live = true;
    const move = (ev) => {
      const dx = ev.clientX - sx0;
      const dy = ev.clientY - sy0;
      const t = pose.target;
      if (corner) {
        // Sized from its top middle, so the corner moves twice as far as it grows.
        t.s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, start.s + (dx * 2) / w0));
        return;
      }
      let x = start.x * L.vw + dx;
      let y = start.y * L.vh + dy;
      const half = (w0 * t.s) / 2;
      // Its middle against the screen's middle and thirds; its sides against the margins.
      const mid = L.vw / 2 + x;
      let gx = null;
      for (const c of [L.vw / 2, L.vw / 3, (L.vw * 2) / 3]) {
        if (Math.abs(mid - c) < SNAP) {
          x = c - L.vw / 2;
          gx = c;
        }
      }
      if (Math.abs(mid - half - gutter()) < SNAP) {
        x = gutter() + half - L.vw / 2;
        gx = gutter();
      }
      if (Math.abs(mid + half - (L.vw - gutter())) < SNAP) {
        x = L.vw - gutter() - half - L.vw / 2;
        gx = L.vw - gutter();
      }
      const midY = L.nameTop + y + (h0 * t.s) / 2;
      let gy = null;
      for (const c of [L.vh / 2, L.vh / 3, (L.vh * 2) / 3]) {
        if (Math.abs(midY - c) < SNAP) {
          y = c - L.nameTop - (h0 * t.s) / 2;
          gy = c;
        }
      }
      showGuides(gx, gy);
      // Never lost off the poster: its middle stays on screen.
      x = Math.max(-L.vw * 0.36, Math.min(L.vw * 0.36, x));
      y = Math.max(-L.nameTop + 40, Math.min(L.vh - L.nameTop - 120, y));
      t.x = x / L.vw;
      t.y = y / L.vh;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      pose.live = false;
      showGuides(null, null);
      savePose(pose.target);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  // The toolbar's moves: align, and start over.
  useEffect(() => {
    if (!apiRef) return undefined;
    apiRef.current = {
      align(where) {
        const name = nameRef.current;
        if (!name) return;
        const t = poseRef.current.target;
        const half = (name.offsetWidth * t.s) / 2;
        const edge = gutter() + half - L.vw / 2;
        t.x = (where === 'left' ? edge : where === 'right' ? -edge : 0) / L.vw;
        savePose(t);
      },
      reset() {
        poseRef.current.target = { x: 0, y: 0, s: 1 };
        savePose(poseRef.current.target);
      },
    };
    return () => {
      apiRef.current = null;
    };
  });

  const figStyle = { width: L.H * HERO_ART.aspect, height: L.H };
  return (
    <div className={`${styles.cast} ${up ? styles.castUp : ''} ${L.wide ? '' : styles.castNarrow} ${editing ? styles.castEditing : ''}`}>
      <HoopBack hoopRef={hoopBackRef} />
      {/* Under him in the stack: it rolls out from behind his legs. */}
      <Ball ballRef={ballRef} ball3dRef={ball3dRef} />
      <div ref={figRef} className={styles.castFig} style={figStyle} aria-hidden>
        {/* His shadow, cast from his own shoes: tight where each sole meets
            the floor, soft where it falls away to the right. */}
        <img className={styles.castGround} src="/assets/hero/art/ken-ground.webp" alt="" draggable={false} />
        <img className={styles.castArt} src={HERO_ART.src} alt="" draggable={false} fetchPriority="high" />
      </div>
      <HoopFront hoopRef={hoopFrontRef} />

      {/* The name, in front of him: he stands behind it. */}
      <div ref={nameRef} className={`${styles.name} ${styles[`name_${nameStyle}`] || ''}`} aria-hidden style={{ top: L.nameTop, '--name-size': `${L.nameSize.toFixed(1)}px` }} onPointerDown={onNameDown}>
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
        {/* In edit mode: selected, as on a canvas. Its box, its handles (the
            bottom right one sizes it), its size. */}
        <span className={styles.select} aria-hidden>
          <span className={styles.selectName}>Kenneth</span>
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((k) => (
            <i key={k} className={styles[`h_${k}`]} data-corner={k === 'se' ? '' : undefined} />
          ))}
          <span ref={sizeRef} className={styles.selectSize} />
        </span>
      </div>
      {/* Snap guides, while dragging. */}
      <span ref={guideVRef} className={styles.guideV} aria-hidden />
      <span ref={guideHRef} className={styles.guideH} aria-hidden />

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
  ['hero>ab', 60], // the page moves down: the hero rises away with Ken, About comes up from below
  ['about', 40], // the statement writes itself, the polaroids land
  ['ab>tl', 110], // the shot: About pans away, the ball goes through the hoop, the timeline comes up under it

  // The career is scrolled through like a page (see freeAt): it gets room, so
  // one swipe moves on a role or so, not the whole career.
  ['tl', 560], // the ball travels 2015 to Now, then the camera pulls back to the whole journey
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

// A stretch of a beat: [f0, f1] as shares of it.
const part = ([a, b], f0, f1) => [a + (b - a) * f0, a + (b - a) * f1];
// Into the career: About pans out to the left as the hoop comes in; later
// the camera tilts down, and the timeline comes up from below (see
// hoopShotAt).
const ABOUT_OUT = part(SPAN['ab>tl'], ...HOOP_SHOT.out);
// The ball's arc from the hero onto Videos: the whole glide to About's stop.
// (It lands a touch before the stop: a glide comes to rest a pixel short.)
const KICK_SPAN = [SPAN['hero>ab'][0], part(SPAN.about, 0.86, 0.86)[0]];
const TL_IN = part(SPAN['ab>tl'], ...HOOP_SHOT.tilt);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const inOut =(t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
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
 * A panel's travel. It comes in over `enter` and leaves over `exit` (a beat's
 * name, or a [from, to] stretch of the journey); each end can be horizontal
 * ('x': in from the right, out to the left) or vertical ('y': up from below,
 * out over the top).
 */
function Panel({ progress, enter, exit, enterAxis = 'x', exitAxis = 'x', reduced, className = '', children, ...rest }) {
  // Gentle: the journey's glides already ease, and easing twice bunches the
  // whole move into the middle of the glide.
  const enterSpan = typeof enter === 'string' ? SPAN[enter] : enter;
  const exitSpan = typeof exit === 'string' ? SPAN[exit] : exit;
  const tin = (v) => (enter ? smooth01(within(v, enterSpan)) : 1);
  const tout = (v) => (exit ? smooth01(within(v, exitSpan)) : 0);
  const x = useTransform(progress, (v) => `${(enterAxis === 'x' ? (1 - tin(v)) * 100 : 0) - (exitAxis === 'x' ? tout(v) * 100 : 0)}%`);
  const y = useTransform(progress, (v) => `${(enterAxis === 'y' ? (1 - tin(v)) * 100 : 0) - (exitAxis === 'y' ? tout(v) * 100 : 0)}%`);
  // Reduced motion: no travel, panels simply swap. A 'fade' exit fades.
  const opacity = useTransform(progress, (v) => {
    if (!reduced) return exitAxis === 'fade' ? 1 - tout(v) : 1;
    const a = enter ? within(v, enterSpan) : 1;
    const b = exit ? within(v, exitSpan) : 0;
    return a > 0.5 && b <= 0.5 ? 1 : 0;
  });
  // Off-stage panels are removed from rendering entirely (not just hidden).
  const [offstage, setOffstage] = useState(!!enter);
  useMotionValueEvent(progress, 'change', (v) => {
    const a = enter ? within(v, enterSpan) : 1;
    const b = exit ? within(v, exitSpan) : 0;
    const off = a <= 0 || b >= 1;
    setOffstage((cur) => (cur === off ? cur : off));
  });
  return (
    <motion.div className={`${styles.panel} ${className}`} style={reduced ? { opacity } : exitAxis === 'fade' ? { x, y, opacity } : { x, y }} hidden={offstage} aria-hidden={offstage || undefined} {...rest}>
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

// How tall the logo stands, big in the middle, as a share of the viewport
// height; and where its centre sits then.
const LOGO_VH = 0.12;
const LOGO_VH_PHONE = 0.18;
const LOGO_AT = 0.56;
// The middle of the apple's body (in the glyph's units): solid all round for
// a radius of about 5, so a dot there grows as a plain circle before the bite
// and the leaf show. The ball becomes the logo here.
const APPLE_HEART = { x: 11.6, y: 14.6 };
const HEART_CLIP = `${(((APPLE_HEART.x - APPLE_BOX.x) / APPLE_BOX.w) * 100).toFixed(2)}% ${(((APPLE_HEART.y - APPLE_BOX.y) / APPLE_BOX.h) * 100).toFixed(2)}%`;
// From the heart to the element's centre, in element px (before scaling).
const HEART_DX = ((APPLE_HEART.x - (APPLE_BOX.x + APPLE_BOX.w / 2)) * LOGO_EL_W) / APPLE_BOX.w;
const HEART_DY = ((APPLE_HEART.y - (APPLE_BOX.y + APPLE_BOX.h / 2)) * LOGO_EL_W) / APPLE_BOX.w;
const BALL_R = TIP_R; // the timeline's ball, in px
// Beat 1, one swipe from Now (as shares of "now"): the words step back, the
// line winds into the chrome ball, the ball melts into the logo, the logo
// comes to the middle and rests there, on the night.
const CLEAR = [0, 0.08];
const REWIND = [0.04, 0.24];
const OPEN = [0.22, 0.7];
const CENTER = [0.5, 0.84];
// Beat 2, the next swipe (as shares of the Mac's runway): the camera, right
// on the closed lid's logo, pulls back and light comes up round it: the
// logo was on the MacBook all along. Our logo is locked onto the lid's from
// the moment the lid can be seen, and hands over to it once it is still.
const LOCK = [0, 0.2]; // our logo onto the lid's
const LIGHT = [0.14, 0.3]; // the aluminium comes up out of the dark
const HAND = [0.28, 0.4]; // our logo takes on the lid's finish, then goes
const SAY = [0.6, 0.92]; // without the 3D Mac: the line comes with the logo (as shares of "now")
const SAY_ON_MAC = [0.26, 0.42]; // with it: once the lid is in view (as shares of the runway)
const REVEAL_END = 0.42; // where it rests, closed, waiting to be opened
// The heart to the farthest point of the glyph (the leaf's tip), in its units.
const HEART_REACH = 13.6;
// What the closed Mac says, once it has been revealed. "|" breaks the line.
const STORY_LINE = "My portfolio isn't a page. | It's my Mac.";
// From here (as a share of "now"), the story is at its end (the idle hint).
const END_FROM = 0.84;

// The timeline playing on by itself: how long it rests on each role once it
// has landed and opened, and on the whole journey before it pulls back to the logo.
const AUTO_REST = 1500;
const AUTO_REST_NOW = 500; // a beat on Now before the ball becomes the logo
const AUTO_REST_LOGO = 250; // a breath on the finished logo, then on to the Mac by itself
// The Mac's drift: each line to the next, continuous, long enough to read.
const DRIFT_MS = 3600;
// Opening the Mac: the lid comes up over the words, the screen wakes, in.
const OPEN_MS = 4400;

// The career plays on by itself as soon as the ball lands: it never stops
// rolling, easing off as it passes a role (so the label can be read) and
// picking up between them. Scrolling moves it as well, both ways; when the
// scrolling stops, it plays on again from wherever it is.
const LEG_MS = 2600; // one role to the next, on average
const WAVE = 0.55; // how much it slows at a role: speed there is 1 - WAVE
const RESUME_MS = 1100; // after a scroll, how long before it plays on again
const waveAt = (u) => 1 - WAVE * Math.cos(2 * Math.PI * u);
/** The career's pace at timeline progress p, in progress per ms. The last
 *  leg (on to Now, as the camera pulls back over the whole journey) slows to
 *  a stop. */
const ROLE_STOPS = timelineStops();
function careerSpeed(p) {
  const stops = ROLE_STOPS;
  const step = stops[1] - stops[0];
  const base = step / LEG_MS;
  const last = stops[stops.length - 1];
  if (p < last) return base * waveAt((((p - stops[0]) / step) % 1) + 1);
  const u = clamp01((p - last) / (TIMELINE_NOW - last));
  // Into Now it eases off, but never to a crawl: it arrives, then becomes the logo.
  return base * (u < 0.5 ? waveAt(u) : (1 + WAVE) * Math.max(0.3, 1 - 0.75 * smooth01((u - 0.5) / 0.5)));
}
// The shot into the career, in ms. Its glide is linear (see shotAt).
const SHOT_MS = 4200;
const linear = (t) => t;
// A speed profile turned into a position curve (0..1 over a glide).
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
// The Mac's drift: even, easing only a little at each word.
const DRIFT = profile((u) => 1 - 0.45 * Math.cos(2 * Math.PI * u));

// At the end of the story, still for this long: "Scroll down".
const IDLE_HINT_MS = 900;

// The way around: three sections along a line at the bottom left, with the
// ball rolling along under them as the page goes. Each section starts under
// its own name; the ball's place is how far through the story you are.
// Any of them is a click away, always.
const SECTIONS = [
  { id: 'hero', label: 'About' },
  { id: 'career', label: 'Career' },
  { id: 'logo', label: 'Work' },
];

function SectionNav({ bounds, goTo, dark }) {
  const [at, setAt] = useState(0);
  const trackRef = useRef(null);
  const ballRef = useRef(null);
  const labelRefs = useRef([]);
  useEffect(() => {
    let raf = 0;
    let shown = -1;
    const read = () => {
      raf = 0;
      const b = bounds();
      const track = trackRef.current;
      if (!b || !track) return;
      const y = window.scrollY;
      let i = 0;
      for (let k = 0; k < SECTIONS.length; k += 1) if (y >= b[k] - 2) i = k;
      const f = clamp01((y - b[i]) / Math.max(1, b[i + 1] - b[i]));
      // Under each name's start, then along to the next one's (the last runs
      // on to the end of the line).
      const xs = labelRefs.current.map((el) => (el ? el.offsetLeft : 0));
      const x0 = xs[i];
      const x1 = i + 1 < xs.length ? xs[i + 1] : track.offsetWidth;
      const x = x0 + (x1 - x0) * f;
      if (Math.abs(x - shown) > 0.05) {
        shown = x;
        // It rolls: its turn is the ground covered over its radius.
        ballRef.current.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) rotate(${((x / 5) * 57.3).toFixed(1)}deg)`;
      }
      setAt((cur) => (cur === i ? cur : i));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [bounds]);
  return (
    <nav className={`${styles.secNav} ${dark ? styles.secNavDark : ''}`} aria-label="Sections">
      <div ref={trackRef} className={styles.secTrack}>
        {SECTIONS.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            type="button"
            className={`${styles.secLink} ${i === at ? styles.secOn : ''}`}
            onClick={() => goTo(x.id)}
            aria-current={i === at ? 'step' : undefined}
          >
            <span className={styles.secNum}>{String(i + 1).padStart(2, '0')}</span>
            {x.label}
          </button>
        ))}
        <span className={styles.secLine} aria-hidden>
          <span ref={ballRef} className={styles.secBall} />
        </span>
      </div>
    </nav>
  );
}

// Edit mode's toolbar, hung top centre: align the name, ink the poster,
// pick how the name is printed, start over, done.
const TYPE_STYLES = [
  { id: 'jersey', label: 'Jersey' },
  { id: 'halftone', label: 'Halftone' },
  { id: 'block', label: 'Block' },
  { id: 'riso', label: 'Riso' },
];
const TYPE_KEY = 'ken:poster-type';
const readType = () => {
  try {
    const t = localStorage.getItem(TYPE_KEY);
    return TYPE_STYLES.some((x) => x.id === t) ? t : null;
  } catch {
    return null;
  }
};

function PosterBar({ palette, onInk, type, onType, onAlign, onReset, onDone }) {
  return (
    <motion.div
      className={styles.posterBar}
      role="toolbar"
      aria-label="Remix the poster"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div className={styles.pbGroup} aria-label="Align">
        {[
          ['left', 'M3 4h10M3 8h6M3 12h10'],
          ['center', 'M3 4h10M5 8h6M3 12h10'],
          ['right', 'M3 4h10M7 8h6M3 12h10'],
        ].map(([where, d]) => (
          <button key={where} type="button" className={styles.pbIcon} onClick={() => onAlign(where)} aria-label={`Align ${where}`} title={`Align ${where}`}>
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d={d} />
            </svg>
          </button>
        ))}
      </div>
      <span className={styles.pbSep} />
      <div className={styles.pbGroup} role="radiogroup" aria-label="Ink">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === palette.id}
            title={p.label}
            aria-label={`${p.label} ink`}
            className={styles.pbInk}
            style={{ '--a': p.pop, '--b': p.pop2 }}
            onClick={() => onInk(p)}
          />
        ))}
      </div>
      <span className={styles.pbSep} />
      <div className={styles.pbGroup} role="radiogroup" aria-label="Lettering">
        {TYPE_STYLES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={t.id === type} className={styles.pbType} onClick={() => onType(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <span className={styles.pbSep} />
      <button type="button" className={styles.pbText} onClick={onReset}>
        Reset
      </button>
      <button type="button" className={styles.pbDone} onClick={onDone}>
        Done
      </button>
    </motion.div>
  );
}

export default function JourneyC({ mode = 'open', active = true, onReachScreen, onSkip, onClosed, phone = false }) {
  const closing = mode === 'close';
  const [palette, setPalette] = useState(readPalette);
  // Edit mode (wide screens with a fine pointer): the visitor remixes the
  // poster. While it is on, the story does not scroll.
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  editingRef.current = editing;
  const castApiRef = useRef(null);
  const [typeStyle, setTypeStyle] = useState(readType);
  const [canEdit] = useState(() => !phone && isWide() && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  useEffect(() => {
    if (!editing) return undefined;
    const esc = (e) => e.key === 'Escape' && setEditing(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [editing]);
  // The Mac room's glow and its key words take the poster's main ink (the
  // second ink can be too dark to read on the night).
  tintChapters([palette.pop]);
  const [reduced] = useState(prefersReducedMotion);
  // The chrome logo is drawn in WebGL (ChromeLogo); without it, a flat one.
  const [chromeOk] = useState(() => hasWebGL2() && !prefersReducedMotion());
  // Phones get the iPhone ending (DOM), so they never load the 3D MacBook.
  const [use3D, setUse3D] = useState(() => !phone && hasWebGL2() && !prefersReducedMotion());
  const [loaded, setLoaded] = useState(() => closing || seenBefore());
  const [lines, setLines] = useState([false, false]);
  const [dark, setDark] = useState(closing);
  const [contactOpen, setContactOpen] = useState(false);
  const [idle, setIdle] = useState(false);
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
  const tlRaw = useTransform(progress, (v) => within(v, SPAN.tl) * TIMELINE_NOW);
  // Eased a touch behind the scroll, so a trackpad's flick reads as a glide
  // along the line rather than a jump.
  const tlProgress = useSpring(tlRaw, { stiffness: 120, damping: 28, mass: 0.7, restDelta: 0.0002 });
  // The ball's shot onto the line, as the timeline arrives (linear: the shot
  // keeps its own time, see shotAt).
  const handoff = useTransform(progress, (v) => within(v, SPAN['ab>tl']));
  // On the career (from the ball's landing, not winding into the logo): skippable.
  const [inCareer, setInCareer] = useState(false);
  useMotionValueEvent(progress, 'change', (v) => {
    const on = v >= part(SPAN['ab>tl'], 0.7, 1)[0] && v < SPAN.now[0] + (SPAN.now[1] - SPAN.now[0]) * 0.02;
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
  // The night comes as the ball opens into the logo: paper to black, so the
  // chrome logo is born on the dark the laptop will rise from.
  const DISSOLVE = [0.1, 0.24];
  const mid = (DISSOLVE[0] + DISSOLVE[1]) / 2;
  const paperOpacity = useTransform(nowT, (t) => 1 - smooth01(within(t, DISSOLVE)));
  const dotOpacity = useTransform(progress, (v) => 1 - smooth01(within(v, TL_IN)));
  // One grain over the whole sheet, hero and About alike (until the Mac).
  const paperGrain = useTransform(nowT, (t) => 0.5 * (1 - within(t, DISSOLVE)));
  // At Now the timeline fades where it is (it does not wind back: after
  // rolling forward all career, a line sliding backward reads as a glitch);
  // the ball, still on its spot, is all that is left.
  const tlFade = useTransform(nowT, (t) => smooth01(within(t, [0, REWIND[1] - 0.04])));
  const rewind = useTransform(nowT, () => 0);
  // The logo's scale when big in the middle.
  const logoBig = () => (window.innerHeight * (phone ? LOGO_VH_PHONE : LOGO_VH)) / LOGO_EL_H;
  // The opening: a circle at the apple's heart, from the ball's size to the
  // whole logo (then no clip at all): it swells, then the bite and the leaf.
  const logoClip = useTransform(nowT, (t) => {
    const k = within(t, OPEN);
    if (k >= 1) return 'none';
    const e = inOut(k);
    const r0 = BALL_R / logoBig();
    const r = r0 + ((HEART_REACH * LOGO_EL_W) / APPLE_BOX.w - r0) * e;
    return `circle(${r.toFixed(2)}px at ${HEART_CLIP})`;
  });
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
  // How far into the Mac's runway (MacRoom's own, eased, progress): beat 2
  // and 3 run on it. Written by MacRoom every frame (see onMacFrame).
  const macP = useRef(0);
  // The line about the Mac: 0..1 as it comes in (driven from MacRoom's frame).
  const sayT = useMotionValue(0);
  const cueOpacity = useTransform(sayT, (k) => within(k, [0.75, 1]));
  const use3DRef = useRef(use3D);
  use3DRef.current = use3D;
  // The logo, every frame: born on the ball (the apple's heart where the
  // ball was), to the middle; then, as the camera pulls back from the lid,
  // locked onto the lid's own logo (wherever the camera puts it), turning
  // the half turn a closed lid's logo has from the front; it takes on the
  // lid's finish, and is gone, leaving the lid's own.
  const logoElRef = useRef(null);
  const logoState = () => {
    const t = nowT.get();
    const rp = macP.current;
    const big = logoBig();
    const c = smooth01(within(t, CENTER));
    const hx = tg.vw / 2 - HEART_DX * big;
    const hy = tg.rulerY - HEART_DY * big;
    const x0 = hx + (tg.vw / 2 - hx) * c;
    const y0 = hy + (tg.vh * LOGO_AT - hy) * c;
    const w = hasLid() ? inOut(within(rp, LOCK)) : 0;
    const f = finalLogo();
    // A hair larger than the lid's own, so it covers it until it hands over.
    const [a, b, cc, d] = f.m.map((v) => v * 1.035);
    // Final matrix as rotate(theta) x [[sx, sk], [0, sy]], so it can be eased.
    let theta = Math.atan2(b, a);
    if (theta < -0.01) theta += Math.PI * 2; // always turn the same way
    const sx = Math.hypot(a, b);
    const sk = Math.cos(theta) * cc + Math.sin(theta) * d;
    const sy = -Math.sin(theta) * cc + Math.cos(theta) * d;
    const th = theta * w;
    const ssx = big + (sx - big) * w;
    const ssy = big + (sy - big) * w;
    const ssk = sk * w;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const x = x0 + (f.x - x0) * w;
    const y = y0 + (f.y - y0) * w;
    const shown = (t >= REWIND[1] ? 1 : 0) * (flatRef.current || !hasLid() ? 1 : 1 - within(rp, [HAND[1] - 0.02, HAND[1]]));
    return {
      transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) matrix(${(cos * ssx).toFixed(5)}, ${(sin * ssx).toFixed(5)}, ${(cos * ssk - sin * ssy).toFixed(5)}, ${(sin * ssk + cos * ssy).toFixed(5)}, 0, 0)`,
      shown,
      t,
      rp,
    };
  };
  const logoTransform = useTransform(nowT, () => logoState().transform);
  const logoOpacity = useTransform(nowT, () => logoState().shown);
  // The flat fallback (no WebGL) still uses these.
  const inkOpacity = useTransform(nowT, (t) => within(t, OPEN));
  const whiteOpacity = useTransform(nowT, () => 1);
  const gridOpacity = useTransform(nowT, (t) => 1 - within(t, [0, 0.1]));

  // The chrome logo (WebGL): the ball melting into it, then a polished,
  // flat inlay with a slow light across it while it waits, then the lid's
  // own finish as it hands over.
  const chromeRef = useRef(null);
  const driveChrome = (t, rp) => {
    const api = chromeRef.current;
    if (!api) return;
    const morph = inOut(within(t, OPEN));
    // Born the ball's exact size at the apple's heart; it swells as it flows.
    const r0 = BALL_R / (logoBig() * LOGO_EL_H);
    const r = r0 + (0.3 - r0) * smooth01(within(morph, [0, 0.55]));
    api.set({
      morph,
      ball: [HEART_DX / LOGO_EL_H, -HEART_DY / LOGO_EL_H, r],
      spin: 0,
      tilt: 0,
      // Flat, like a real inlay, once it has formed; lit softly, like one.
      flat: smooth01(within(t, [OPEN[1] - 0.12, CENTER[1]])),
      soft: smooth01(within(t, [OPEN[0] + 0.08, OPEN[1]])),
      // The light drifting across it, while it is big and waiting.
      idle: smooth01(within(t, [CENTER[0], CENTER[1]])) * (1 - smooth01(within(rp, LOCK))),
      ink: hasLid() ? smooth01(within(rp, HAND)) : 0,
    });
  };
  // Every frame while the logo is about (it follows the camera as it pulls
  // back, which scrolling alone does not report).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = logoElRef.current;
      const st = logoState();
      if (st.t <= 0 || st.rp > HAND[1] + 0.05) {
        if (el && el.style.opacity !== '0') el.style.opacity = '0';
        return;
      }
      if (el) {
        el.style.transform = st.transform;
        el.style.opacity = st.shown.toFixed(3);
      }
      driveChrome(st.t, st.rp);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

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
  // Under the pinned deck the page itself is the section's colour (paper,
  // or night for the Mac): while the page moves, a frame's lag in the pin
  // never flashes the document's black.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.backgroundColor;
    root.style.backgroundColor = dark ? '#07070a' : '#ededea';
    return () => {
      root.style.backgroundColor = prev;
    };
  }, [dark]);

  useEffect(() => {
    preloadShutter();
    preloadSwish();
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
    // The career playing on by itself (see careerTick).
    let careerAuto = false;
    let careerRaf = 0;
    let careerY = 0; // where it has played to, kept in fractions of a px
    let careerVel = 0; // px per ms
    let careerLast = 0;
    let userAt = 0; // the visitor's last scroll in the career
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
    const stops = () => {
      if (!deckRef.current) return [];
      const list = [
        { id: 'hero', y: deckAt(0) },
        // About sits at the end of its beat, so each move between hero,
        // About and the timeline is all crossing, no dead scroll.
        { id: 'about', y: spanAt(SPAN.about, 0.9), ms: 1900, curve: linear },
        // The shot into the career: the page comes up, the ball drops
        // through the net onto the line. Linear, so the ball keeps true time
        // (the panels ease their own moves).
        { id: 'career', y: spanAt(SPAN.tl, 0), ms: SHOT_MS, curve: linear },
        // From there the career plays on by itself (see careerTick), and is
        // scrolled like a page, both ways, until it comes to rest on Now.
        { id: 'now', y: spanAt(SPAN.tl, 1), ms: 1700 },
        // Then it pulls back until the whole career is the Apple logo, and
        // the line rises; from there it drifts on into the Mac.
        // Beat 1: the ball becomes the logo, which rests in the middle.
        { id: 'logo', y: spanAt(SPAN.now, 1), ms: 4400 },
      ];
      // Beat 2: the pull-back that shows the logo was on the closed Mac. It
      // rests there, waiting to be opened (beat 3: one scroll or a click).
      if (runwayRef.current && !phone && use3DRef.current) list.push({ id: 'mac', y: runAt(REVEAL_END), ms: 1900 });
      // Phones: the iPhone ending's own stops. The Mac has none: from the
      // closed laptop, one scroll (or a click) opens it and goes in.
      if (runwayRef.current && phone) PHONE_STOPS.forEach((t, i) => list.push({ id: `chapter${i}`, y: runAt(t), ms: 1300 }));
      return list;
    };
    const glide = (y, ms, via, path, ease = sineInOut) => {
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
      const curve = ease;
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
        glide(end + 2, msOverride ?? OPEN_MS);
        return;
      }
      const prev = step >= 0 ? step : nearest(s, window.scrollY);
      step = i;
      // Neighbouring stops can ask for their own pace (the logo and the
      // laptop take their time), in both directions.
      const paced = Math.abs(i - prev) === 1 ? (i > prev ? s[i].ms : s[prev].ms) : null;
      const via = i === prev + 1 ? s[i].via : null;
      // A leg with its own curve keeps it both ways (the shot plays back).
      const ease = Math.abs(i - prev) === 1 ? (i > prev ? s[i].curve : s[prev].curve) : undefined;
      glide(s[i].y, msOverride ?? paced ?? msFor(window.scrollY, s[i].y), via, null, ease);
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
    // The logo plays on by itself too, onto the closed Mac (it never just
    // stops on the logo); the closed Mac waits for its scroll.
    const drifts = (id) => id?.startsWith('chapter');
    const playsOn = (id) => id === 'now' || (id === 'logo' && stops().some((x) => x.id === 'mac')) || drifts(id);
    const playOn = () => {
      clearTimeout(autoTimer);
      autoGlide = false;
      const here = step >= 0 ? stops()[step] : null;
      // Landed on the career: it plays on by itself from here, at once.
      if (here?.id === 'career') {
        startCareer();
        return;
      }
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
          // The logo to the first line carries the page into the Mac: longer.
          const ms = i >= s.length ? DRIFT_MS * 1.4 : here.id === 'logo' ? DRIFT_MS * 1.7 : DRIFT_MS;
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
    const DARK_FROM = ['logo'];
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
      el.style.background = target.id === 'hero' ? 'var(--stage)' : dark ? '#07070a' : 'var(--paper)';
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
      if (i < 0) return false;
      const from = step >= 0 ? step : nearest(s, window.scrollY);
      // Forward onto a stop that plays on (the logo): it plays on from there.
      autoRef.current = i > from && i < s.length && playsOn(s[i].id);
      if (i < s.length && (opts.cut || Math.abs(i - from) > 1)) cut(i);
      else goTo(i, ms);
      return true;
    };

    // The career is scrubbed, not stepped: from Me to Now the page scrolls
    // like a page, so the timeline follows the scroll exactly, both ways.
    // `freeAt` says whether a scroll at y (going dir) is the page's own.
    const zoneOf = () => {
      const s = stops();
      const a = s.find((x) => x.id === 'career');
      const n = s.find((x) => x.id === 'now');
      return a && n ? [a.y, n.y] : null;
    };
    const freeAt = (y, dir) => {
      const z = zoneOf();
      if (!z) return false;
      if (y > z[0] + 1 && y < z[1] - 1) return true;
      if (dir > 0 && Math.abs(y - z[0]) <= 2) return true;
      if (dir < 0 && Math.abs(y - z[1]) <= 2) return true;
      return false;
    };

    // The career playing on: the page scrolls itself, a little every frame,
    // at the career's pace (slower past each role). The visitor's own scroll
    // moves it too, either way; a moment after it stops, play goes on from
    // there. It ends at rest on Now, which plays on into the logo.
    const careerSpan = () => [spanAt(SPAN.tl, 0), spanAt(SPAN.tl, 1)];
    let careerZone = null; // [start, Now] in px, measured when play starts
    let careerPx = null; // the career beat's own span, in px
    const startCareer = () => {
      if (!stepping) return;
      careerZone = zoneOf();
      careerPx = careerSpan();
      careerAuto = true;
      careerY = window.scrollY;
      careerLast = 0;
      cancelAnimationFrame(careerRaf);
      careerRaf = requestAnimationFrame(careerTick);
    };
    const careerTick = (now) => {
      careerRaf = requestAnimationFrame(careerTick);
      const dt = careerLast ? Math.min(50, now - careerLast) : 16;
      careerLast = now;
      const z = careerZone;
      const y = window.scrollY;
      if (!careerAuto || !z || y < z[0] - 2 || y > z[1] + 2) {
        careerAuto = false;
        careerVel = 0;
        cancelAnimationFrame(careerRaf);
        return;
      }
      // Paused: under a glide, a scroll (for a moment), the contact card, or
      // with nobody watching. It picks up gently again.
      if (gliding || closingRef.current || contactRef.current || document.hidden || now - userAt < RESUME_MS) {
        careerVel = 0;
        careerY = y;
        return;
      }
      if (Math.abs(y - careerY) > 3) careerY = y; // moved under it (a key, the bar)
      const [a, b] = careerPx;
      const pxPerP = (b - a) / TIMELINE_NOW;
      const target = careerSpeed(((careerY - a) / (b - a)) * TIMELINE_NOW) * pxPerP;
      careerVel += (target - careerVel) * (1 - Math.exp(-dt / 260));
      careerY = Math.min(z[1], careerY + careerVel * dt);
      // Whole px only: a fractional scroll leaves the pinned deck a hair off.
      window.scrollTo(0, Math.round(careerY));
      lastY = careerY;
      if (careerY >= z[1] - 0.5) {
        // On Now: the whole journey laid out, then on into the logo.
        careerAuto = false;
        careerVel = 0;
        cancelAnimationFrame(careerRaf);
        step = stops().findIndex((x) => x.id === 'now');
        autoRef.current = true;
        playOn();
      }
    };
    // In the career, the visitor's own scroll: it moves the page, and play
    // goes on from there once it stops.
    const touchCareer = () => {
      userAt = performance.now();
      // The visitor drives now: nothing queued (Now's rest into the logo)
      // may pull them on.
      step = -1;
      autoRef.current = false;
      clearTimeout(autoTimer);
      if (!careerAuto) startCareer();
    };

    const onScroll = () => {
      const y = window.scrollY;
      // In the career, a move it did not make itself (a phone's coasting
      // flick, the scrollbar) is the visitor's: play waits for it to end.
      if (careerAuto && !gliding && Math.abs(y - Math.round(careerY)) > 2) userAt = performance.now();
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
        if (!inRange(s, now) || freeAt(now, 0)) {
          step = -1;
          return;
        }
        let i = nearest(s, now);
        // Just above the career's start, the visitor was heading back up
        // (a scroll that overshot it): on to About, not into the career.
        if (s[i].id === 'career' && now < s[i].y - 2) i -= 1;
        // Resting where it was going (a glide's last frame): nothing to do.
        if (i === step && Math.abs(s[i].y - now) <= 2) return;
        step = i;
        autoRef.current = false; // dragged (the scrollbar): the visitor drives
        clearTimeout(autoTimer);
        if (Math.abs(s[i].y - now) > 2) glide(s[i].y, 480);
      }, 160);
    };

    const onWheel = (e) => {
      if (editingRef.current) {
        e.preventDefault();
        return;
      }
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
      // In the career, the page scrolls itself (see freeAt). But never past
      // Now: a swipe's momentum would race through everything after it.
      // It stops on Now, and what comes next waits for a swipe of its own.
      if (!sideways && freeAt(window.scrollY, Math.sign(delta))) {
        const z = zoneOf();
        const px = delta * (e.deltaMode === 1 ? 16 : 1);
        if (delta > 0 && z && window.scrollY + px >= z[1] - 1) {
          e.preventDefault();
          window.scrollTo(0, Math.round(z[1]));
          lastY = Math.round(z[1]);
          step = stops().findIndex((x) => x.id === 'now');
          autoRef.current = false;
          clearTimeout(autoTimer);
          gestureSpent = true;
          steppedAt = t;
          return;
        }
        step = -1;
        autoRef.current = false;
        clearTimeout(autoTimer);
        touchCareer();
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
      if (editingRef.current) return;
      const dir = touchY == null ? 0 : Math.sign(touchY - (e.touches[0]?.clientY ?? touchY));
      if (!gliding && freeAt(window.scrollY, dir)) {
        touchCareer(); // the career: the page's own scroll
        return;
      }
      if (closingRef.current || gliding || (touchY != null && engaged())) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      if (touchY == null || closingRef.current) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      if (Math.abs(dy) <= 24 || !engaged() || freeAt(window.scrollY, Math.sign(dy))) return;
      if (!gliding) userGo(Math.sign(dy));
      else if (autoGlide && dy < 0) userGo(-1);
    };
    const onKey = (e) => {
      if (editingRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey || closingRef.current || (!engaged() && !gliding)) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
      const fwd = ['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key);
      const back = ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key);
      if (!fwd && !back) return;
      e.preventDefault();
      // In the career, a key moves on (or back) a role.
      if (!gliding && freeAt(window.scrollY, fwd ? 1 : -1)) {
        const [a, b] = careerSpan();
        const ys = [...timelineStops().map((p) => a + ((b - a) * p) / TIMELINE_NOW), b];
        const y = window.scrollY;
        const to = fwd ? ys.find((x) => x > y + 2) : [...ys].reverse().find((x) => x < y - 2);
        touchCareer();
        if (to != null) glide(to, 700);
        else userGo(fwd ? 1 : -1);
        return;
      }
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
      cancelAnimationFrame(careerRaf);
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

  // The end of the story (the logo and its line, then the laptop). It opens
  // with a scroll, never a click.
  const [endOn, setEndOn] = useState(false);
  useMotionValueEvent(nowT, 'change', (t) => {
    const on = t >= END_FROM;
    setEndOn((cur) => (cur === on ? cur : on));
  });
  // "See the work": to the closed Mac and what it is (so nobody lands on a
  // desktop without knowing why); with no Mac to show, straight in.
  const seeWork = useCallback(() => {
    if (!goToIdRef.current?.('mac', undefined, { cut: true })) onSkip?.();
  }, [onSkip]);

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
  // On the Mac's runway, at a share of it.
  const runY = useCallback((f) => {
    const r = runwayRef.current;
    if (!r) return nowY(1);
    return r.offsetTop + (maxScroll() - r.offsetTop) * f;
  }, [nowY]);
  // The aluminium comes up out of the dark round the logo as the camera
  // pulls back (by then our logo sits exactly on the lid's).
  const sceneFadeFrom = useCallback(() => runY(LIGHT[0]), [runY]);
  // The 3D renders from beat 1 on (warm, so beat 2 starts on its first frame).
  const liveFrom = useCallback(() => nowY(0.5), [nowY]);
  const sceneFadeTo = useCallback(() => runY(LIGHT[1]), [runY]);

  const flat = !use3D && !phone;

  // On the hero (the remix button shows only there, and edit mode ends if
  // the page moves on).
  const [heroOn, setHeroOn] = useState(true);
  useMotionValueEvent(progress, 'change', (v) => {
    const on = v < SPAN['hero>ab'][0] + 0.002;
    setHeroOn((cur) => (cur === on ? cur : on));
    if (!on && editingRef.current) setEditing(false);
  });

  // What the Mac is, over the logo: on the 3D Mac it lives in the room behind
  // the laptop, so the lid comes up over it as it opens (and it fades as the
  // lid passes).
  const introOuterRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  // The line comes in once the closed Mac is in view (with no 3D Mac, with
  // the logo).
  useMotionValueEvent(nowT, 'change', (t) => {
    if (!use3D || phone) sayT.set(smooth01(within(t, SAY)));
  });
  const onMacFrame = useCallback((y, p) => {
    macP.current = p;
    // It rises out of the laptop's way as the camera pulls back, and goes as
    // the lid comes up.
    const el = introOuterRef.current;
    if (el) el.style.setProperty('--lift', smooth01(within(p, [0.1, 0.32])).toFixed(3));
    if (el) el.style.opacity = (1 - smooth01(within(p, [MAC_BEATS.lid[0] + 0.01, MAC_BEATS.lid[0] + 0.12]))).toFixed(3);
    const r = p > LOCK[1];
    setRevealed((cur) => (cur === r ? cur : r));
    sayT.set(smooth01(within(p, SAY_ON_MAC)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const macIntro = (
    <div ref={introOuterRef} className={styles.storyOuter}>
      <div className={styles.storyLineWrap}>
        <RiseWords text={STORY_LINE} reveal={sayT} className={styles.bridgeLine} />
        {flat && (
          <button type="button" className={styles.btnLight} onClick={() => onReachScreen?.()}>
            See my work
          </button>
        )}
      </div>
      {!flat && (
        // (Only once there is a Mac to open; low, under the laptop.)
        <motion.p className={styles.openCue} style={{ opacity: revealed ? cueOpacity : 0, transition: 'opacity 400ms ease' }}>
          {/* A ripple of light runs along the words, letter by letter. */}
          <span className={styles.cueText} aria-label="Scroll to open">
            {[...'Scroll to open'].map((ch, i) => (
              <span key={i} style={{ '--i': i }} aria-hidden>
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </span>
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M8 3v10M4 9l4 4 4-4" />
          </svg>
        </motion.p>
      )}
    </div>
  );

  // Where each section starts on the page (and where the last one ends): the
  // story, from the career's first frame, from the logo, to the end of the Mac.
  const navBounds = useCallback(() => {
    const d = deckRef.current;
    if (!d) return null;
    const at = (f) => d.offsetTop + (d.offsetHeight - window.innerHeight) * f;
    return [at(0), at(SPAN.tl[0]), at(SPAN.now[0]), runwayRef.current ? maxScroll() : at(1)];
  }, []);

  return (
    <section
      className={styles.journey}
      style={paletteStyle(palette)}
      data-dark={dark ? 'true' : undefined}
      aria-label="Introduction"
    >
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
        beats={MAC_BEATS}
        words={false}
        sway={false}
        wordsOnTop
        arrive="fade"
        sceneFadeFrom={sceneFadeFrom}
        sceneFadeTo={sceneFadeTo}
        liveFrom={liveFrom}
        logoRef={logoRef}
        className={dark ? '' : styles.roomPaper}
        onFrame={use3D ? onMacFrame : undefined}
      />

      {/* The logo: its own fixed layer, over the 3D Mac and the page, so it
          stays on the lid's logo as the page moves on into the Mac's
          runway (the deck scrolls away there). */}
      <div className={styles.logoLayer}>
        {/* What the logo means, over everything (the lid never covers it). */}
        {use3D && macIntro}
        {/* Ten years wound into one dot, which opens into the lid's own
            Apple logo and settles onto it as the MacBook comes up. */}
        {chromeOk ? (
          <div ref={logoElRef} className={styles.logo} style={{ width: LOGO_EL_W, height: LOGO_EL_H, opacity: 0 }} aria-hidden>
            <ChromeLogo apiRef={chromeRef} path={APPLE_PATH} box={APPLE_BOX} className={styles.logoCanvas} maxScale={2} />
          </div>
        ) : (
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
        )}
      </div>

      {/* The Mac room is drawn for the eye only; what Ken does, for everyone. */}
      <ul className={styles.srOnly} aria-label="What I do">
        {SERVICES.map((sv) => (
          <li key={sv.id}>
            {sv.name}: {sv.items.map((it) => it.label).join(', ')}
          </li>
        ))}
      </ul>

      <header className={styles.bar}>
        <nav className={styles.barLinks} aria-label="Quick links">
          {/* Straight to the work, for anyone who wants proof first. */}
          <button type="button" className={styles.barLink} onClick={seeWork}>
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
            <motion.div className={`${styles.grid} ${lines[0] || aboutInstant ? styles.gridOn : ''}`} style={{ opacity: gridOpacity }} aria-hidden>
              <motion.div
                className={styles.gridLines}
                style={{ backgroundSize: gridSize, backgroundPosition: gridPosition }}
              />
            </motion.div>

            {/* The sheet the hero and About share: the canvas's dots, rippling
                where the ball hits. It gives way to the timeline's grid as the
                camera tilts down into the career. */}
            <DotField className={styles.dotField} opacity={dotOpacity} />
            {/* The hero's print grain, carried on in the paper under About and
                the timeline, so the whole story is one printed sheet. */}
            <motion.span className={styles.paperGrain} style={{ opacity: paperGrain }} aria-hidden />

            {/* The hero rises away over the top; About is already there under it. */}
            <Panel progress={progress} exit="hero>ab" exitAxis="y" reduced={reduced} className={styles.heroPanel} aria-label="Ken">
              <Hero on={loaded || closing} />
            </Panel>

            {/* About does not move: it is on the same sheet as the hero, and
                waits for the ball (each of its bounces brings a piece). */}
            <Panel progress={progress} exit={ABOUT_OUT} exitAxis="fade" reduced={reduced} className={`${styles.aboutPanel} ${wide ? styles.aboutWide : ''}`} aria-label="About">
              <MePanel instant={aboutInstant} wide={wide} />
            </Panel>

            {/* It comes up under the ball's shot, settled before the ball lands. */}
            <Panel progress={progress} enter={TL_IN} enterAxis="y" reduced={reduced} className={styles.timelinePanel} aria-label="Career timeline">
              <TimelineC progress={tlProgress} fade={tlFade} retract={rewind} handoff={handoff} />
              <AnimatePresence>
                {inCareer && (
                  <motion.button
                    type="button"
                    className={styles.skipCareer}
                    onClick={() => goToIdRef.current?.('logo', undefined, { cut: true })}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    Skip career
                    <svg viewBox="0 0 16 16" aria-hidden>
                      <path d="M3 8h10M9 4l4 4-4 4" />
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
              nameStyle={typeStyle ?? palette.name}
              editing={editing}
              apiRef={castApiRef}
            />


            {/* No 3D Mac (phones, the flat fallback): the words sit on the page. */}
            {!use3D && macIntro}



          </div>
        </div>
        {phone ? <PhoneEnding onReach={onReachScreen} innerRef={runwayRef} /> : !flat && <div ref={runwayRef} className={styles.runway} aria-hidden />}
      </div>

      {/* At the end of the story only: the ball does the asking before that. */}
      <div className={`${styles.idleHint} ${idle && endOn && !revealed && !contactOpen ? styles.idleHintOn : ''}`} aria-hidden>
        <span>{phone ? 'Swipe up' : 'Scroll down'}</span>
        <i />
      </div>

      {/* Contact, always there: bottom right, all the way through the story
          (hidden in the Mac's dark room, where the bar's own button reads). */}
      {!dark && (
        <button type="button" className={styles.contactFab} onClick={() => setContactOpen(true)}>
          <i aria-hidden />
          Contact me
        </button>
      )}

      <SectionNav bounds={navBounds} goTo={(id) => goToIdRef.current?.(id)} dark={dark} />

      {/* Remix the poster: on the hero, wide screens with a mouse only. */}
      {canEdit && !editing && heroOn && (
        <button type="button" className={styles.remix} onClick={() => setEditing(true)}>
          <svg viewBox="0 0 16 16" aria-hidden>
            <path d="M3 13l1-3.5L10.5 3a1.4 1.4 0 012 2L6 11.5z M9.5 4l2.5 2.5" />
          </svg>
          Remix this poster
        </button>
      )}
      <AnimatePresence>
        {editing && (
          <PosterBar
            palette={palette}
            onInk={(p) => {
              savePalette(p.id);
              setPalette(p);
            }}
            type={typeStyle ?? palette.name}
            onType={(t) => {
              setTypeStyle(t);
              try {
                localStorage.setItem(TYPE_KEY, t);
              } catch {
                /* private mode */
              }
            }}
            onAlign={(where) => castApiRef.current?.align(where)}
            onReset={() => {
              castApiRef.current?.reset();
              setTypeStyle(null);
              try {
                localStorage.removeItem(TYPE_KEY);
              } catch {
                /* private mode */
              }
            }}
            onDone={() => setEditing(false)}
          />
        )}
      </AnimatePresence>

      {/* A skip dips through this for a beat (see cut). */}
      <div ref={cutRef} className={styles.cut} aria-hidden />

      {!loaded && <Loader reduced={reduced} onDone={onLoaded} withModel={use3D} />}
      <BriefSheet open={contactOpen} onClose={() => setContactOpen(false)} onSeeWork={seeWork} style={paletteStyle(palette)} />
    </section>
  );
}
