// Journey C: Ken's own flow, from his notes (v4). One light set, then the dark:
//   Loader: the lens iris opens with real load progress.
//   A pinned deck driven by scroll, on paper over a design-canvas grid:
//       Hero: Ken walks in, the shutter fires, he stands for the photo
//       → About: "10 years" rolls up, the statement types, the prints land
//       → Career timeline: the ruler fills and pans in, each role (company,
//         title, years) arrives; the camera zooms in on Now
//       → the cut to the dark: Now's ball swallows the screen; the line rises;
//         a white ball becomes the Apple logo and settles on the lid as the
//         MacBook comes up
//   → Build / Move / Ship: the Mac swings from overhead to the front
//   → lid opens → welcome → macOS.
// Same contract as the other intros.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import ContactCard from '../../Intro/ContactCard.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { POSES } from '../../Intro3/timeline.js';
import { playShutter, preloadShutter } from './sfx.js';
import MacRoom from '../MacRoom.jsx';
import { WORK } from '../content.js';
import TimelineC, { timelineCamera, timelineLayout, timelineOrigin, timelineStops } from './TimelineC.jsx';
import PhoneEnding, { phoneLogoPoint } from './PhoneEnding.jsx';
import styles from './JourneyC.module.css';

const EASE = [0.16, 1, 0.3, 1];
// Same file the 3D rig loads (kept as a literal so this chunk stays free of three.js).
const MODEL_SRC = '/models/macbook-rigged.glb';

// Overhead, a touch toward the viewer (straight down would flip the rig).
const OVERHEAD = { yaw: 0, pitch: 0.95, radius: 13.5, target: new THREE.Vector3(0, 0, 0.15) };
const FLOW_POSES = { hero: OVERHEAD, front: POSES.front };

// HERO FOOTAGE. Swap `src` for Ken's own clip (same folder) and tune the two
// times: where playback starts and the frame the camera "takes".
// The current file is a Pexels stand-in (see public/assets/hero/walkin/CREDITS.txt).
const HERO_VIDEO = {
  src: '/assets/hero/walkin/stock-walkin.mp4',
  startAt: 1.0, // he steps in from the right edge
  captureAt: 4.3, // facing the camera
  rate: 1,
};

// Shimmering lines for the loader. How many get shown depends on how long
// loading really takes; the last one always closes it.
const LOADING = ['Designer, Hyderabad', 'Ten years in', 'Brands, motion, interfaces', 'Trial and error, mostly error'];
const LOADING_LAST = 'Setting up the shot';
const LINE_MS = 900;
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

export const ABOUT = ['Ten years shaping brands, campaigns and interfaces.', 'I start with the idea and stay for the last pixel.'];

/* ------------------------------------------------------------------ */
/* Loading: real progress (fonts, hero clip, MacBook model)            */
/* ------------------------------------------------------------------ */

function useAssetProgress(enabled) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const parts = { fonts: 0, video: 0, model: 0 };
    const push = () => live && setP(parts.fonts * 0.15 + parts.video * 0.35 + parts.model * 0.5);
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
    stream(HERO_VIDEO.src, 'video');
    stream(MODEL_SRC, 'model');
    return () => {
      live = false;
    };
  }, [enabled]);
  return p;
}

/** A six-blade iris. `open` 0..1 widens the hexagonal opening; light shows through. */
function Aperture({ open }) {
  const R = 50;
  const r = 5 + open * 39;
  const twist = 34 - open * 10;
  const pt = (rad, deg) => {
    const a = (deg * Math.PI) / 180;
    return `${(rad * Math.cos(a)).toFixed(2)},${(rad * Math.sin(a)).toFixed(2)}`;
  };
  return (
    <svg className={styles.aperture} viewBox="-56 -56 112 112" aria-hidden>
      <defs>
        <clipPath id="c-iris">
          <circle r={R} />
        </clipPath>
      </defs>
      <circle r={R} className={styles.apertureHole} />
      <g clipPath="url(#c-iris)">
        {Array.from({ length: 6 }, (_, i) => {
          const a = i * 60 - 90;
          return (
            <polygon
              key={i}
              className={styles.blade}
              points={`${pt(r, a)} ${pt(r, a + 60)} ${pt(R + 14, a + 60 + twist)} ${pt(R + 14, a + twist)}`}
            />
          );
        })}
      </g>
      <circle r={R} className={styles.apertureRing} />
      <circle r={R + 4} className={styles.progressRing} pathLength="1" style={{ strokeDashoffset: 1 - open }} />
    </svg>
  );
}

function Loader({ reduced, onDone }) {
  const real = useAssetProgress(true);
  const [shown, setShown] = useState(0);
  const [line, setLine] = useState(0);
  const [out, setOut] = useState(false);
  const realRef = useRef(0);
  realRef.current = real;
  const lineRef = useRef(0);

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    let lastLineAt = t0;
    let closing = false;
    let disp = 0;
    const step = (now) => {
      const elapsed = now - t0;
      // Never ahead of real loading, never faster than the minimum time.
      const cap = elapsed >= MAX_LOAD_MS ? 1 : Math.min(realRef.current, elapsed / MIN_LOAD_MS);
      disp += (cap - disp) * 0.07;
      if (cap - disp < 0.004) disp = cap;
      setShown(disp);
      const ready = disp >= 0.995;
      if (!closing && now - lastLineAt > LINE_MS) {
        lastLineAt = now;
        if (ready) {
          closing = true;
          setLine(-1); // the closing line
          setTimeout(() => setOut(true), reduced ? 200 : 520);
          setTimeout(onDone, reduced ? 220 : 980);
        } else {
          lineRef.current = (lineRef.current + 1) % LOADING.length;
          setLine(lineRef.current);
        }
      }
      if (!closing || disp < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.round(shown * 100);
  const text = line === -1 ? LOADING_LAST : LOADING[line];
  return (
    <div className={`${styles.loader} ${out ? styles.loaderOut : ''}`} role="status" aria-label={`Loading, ${pct} percent`}>
      <div className={styles.lens}>
        <Aperture open={shown} />
        <span className={styles.pct} aria-hidden>
          {String(pct).padStart(2, '0')}
        </span>
      </div>
      <div className={styles.loaderLine} aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={text}
            className={styles.loaderText}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

// PREVIEW: ?theme=dark shows the hero on a dark set, for comparison.
const HERO_DARK = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('theme') === 'dark';

// The camera's readout: a running timecode while he walks in (25 fps).
const timecode = (sec) => {
  const f = Math.floor((sec % 1) * 25);
  const s = Math.floor(sec);
  const p2 = (n) => String(n).padStart(2, '0');
  return `00:00:${p2(s)}:${p2(f)}`;
};
const localTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

function Hero({ go, reduced, instant, onOpenMac, onScrollOn, phone }) {
  const tcRef = useRef(null);
  const [shot, setShot] = useState(!!instant);
  // The letters rise a frame after mount, so there is always a start to
  // animate from (even when there is no loader in front).
  const [lettersUp, setLettersUp] = useState(!!instant);
  useEffect(() => {
    if (!(go || instant || reduced)) return undefined;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setLettersUp(true));
    });
    return () => cancelAnimationFrame(id);
  }, [go, instant, reduced]);
  const [flash, setFlash] = useState(0);
  const videoRef = useRef(null);
  const shotRef = useRef(!!instant);

  const capture = useCallback(() => {
    if (shotRef.current) return;
    shotRef.current = true;
    const v = videoRef.current;
    if (v) {
      v.pause();
      // Land exactly on the chosen frame so the still is always the same.
      if (Math.abs(v.currentTime - HERO_VIDEO.captureAt) > 0.08) v.currentTime = HERO_VIDEO.captureAt;
    }
    playShutter();
    if (!reduced) setFlash((n) => n + 1);
    setShot(true);
  }, [reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const still = () => {
      v.currentTime = HERO_VIDEO.captureAt;
    };
    if (instant || reduced) {
      if (v.readyState >= 1) still();
      else v.addEventListener('loadedmetadata', still, { once: true });
      if (reduced && go) capture();
      return () => v.removeEventListener('loadedmetadata', still);
    }
    if (!go) return undefined;
    let raf = 0;
    const watch = () => {
      if (v.currentTime >= HERO_VIDEO.captureAt) capture();
      else raf = requestAnimationFrame(watch);
    };
    const start = () => {
      v.currentTime = HERO_VIDEO.startAt;
      v.playbackRate = HERO_VIDEO.rate;
      v.play().then(() => {
        raf = requestAnimationFrame(watch);
      }, capture);
    };
    if (v.readyState >= 1) start();
    else v.addEventListener('loadedmetadata', start, { once: true });
    // Never leave the hero waiting on a clip that will not play.
    const bail = setTimeout(capture, 6000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bail);
      v.removeEventListener('loadedmetadata', start);
    };
  }, [go, instant, reduced, capture]);

  const rise = (d) =>
    reduced
      ? {}
      : { initial: { opacity: 0, y: 26 }, animate: shot ? { opacity: 1, y: 0 } : undefined, transition: { duration: 0.9, ease: EASE, delay: d } };

  // The timecode runs with the footage until the shot is taken.
  useEffect(() => {
    if (shot || !go) return undefined;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (tcRef.current && v) tcRef.current.textContent = timecode(Math.max(0, v.currentTime - HERO_VIDEO.startAt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [go, shot]);

  return (
    <div className={`${styles.hero} ${HERO_DARK ? styles.heroDark : ''}`}>
      <div className={`${styles.set} ${shot ? styles.setShot : ''}`} aria-hidden>
        {/* The camera pushes in to chest height while he walks in from the right. */}
        <div className={`${styles.figure} ${go || instant || reduced ? styles.figureIn : ''}`}>
          <video ref={videoRef} className={styles.clip} src={HERO_VIDEO.src} muted playsInline preload="auto" />
        </div>
        <span className={styles.viewfinder}>
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>

      {/* The camera's readout: REC and a running timecode while he walks
          in; once the shot is taken, where and when it was taken. */}
      <motion.p className={`${styles.hud} ${shot ? styles.hudShot : ''}`} initial={reduced ? false : { opacity: 0 }} animate={go || instant ? { opacity: 1 } : undefined} transition={{ duration: 0.6, delay: 0.2 }} aria-hidden>
        {shot ? (
          <>
            <span>Hyderabad</span>
            <span>{localTime()}</span>
          </>
        ) : (
          <>
            <i className={styles.rec} />
            <span>REC</span>
            <span ref={tcRef}>00:00:00:00</span>
          </>
        )}
      </motion.p>

      <div className={styles.heroCopy}>
        <h1 className={styles.hello}>
          <motion.span
            className={styles.hi}
            {...(reduced ? {} : { initial: { opacity: 0, y: 18 }, animate: go || instant ? { opacity: 1, y: 0 } : undefined, transition: { duration: 0.9, ease: EASE, delay: 0.25 } })}
          >
            Hi, I&apos;m
          </motion.span>
          {/* The name rises letter by letter, thin and narrow; when the
              shutter fires it snaps to full weight, as if the photo inflated it. */}
          <span className={`${styles.kenWrap} ${lettersUp ? styles.kenIn : ''} ${shot ? styles.kenSet : ''}`}>
            <span className={styles.ken} aria-label="Ken">
              {['K', 'e', 'n'].map((c, i) => (
                <span key={c} className={styles.kenLetter} style={{ '--i': i }} aria-hidden>
                  <span>{c}</span>
                </span>
              ))}
            </span>
          </span>
        </h1>
      </div>

      <div className={styles.heroFoot}>
        <motion.div className={styles.heroMeta} {...rise(0.45)}>
          <p className={styles.role}>Designer</p>
          <p className={styles.tagline}>Trial and error, but mostly error.</p>
        </motion.div>
        <motion.div className={styles.heroActions} {...rise(0.6)}>
          <button type="button" className={styles.btn} onClick={onOpenMac}>
            {phone ? 'Open my iPhone' : 'Open my Mac'}
          </button>
          <button type="button" className={styles.btnGhost} onClick={onScrollOn}>
            Scroll
            <i aria-hidden />
          </button>
        </motion.div>
      </div>

      {flash > 0 && <div key={flash} className={styles.flash} aria-hidden />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The deck: one pinned viewport in the dark, driven by scroll         */
/* ------------------------------------------------------------------ */

// Scroll budget per beat, in viewport heights. The hero is not in here: it
// sits above the deck and leaves by gesture (the hand over the lens).
const BEATS = [
  ['hero', 25],
  ['hero>ab', 60], // About rises from below as the hero lifts away
  ['about', 40], // "10 years" rolls up and both lines type themselves (on time)
  ['ab>tl', 60], // About leaves left, the timeline arrives from the right
  ['tl', 130], // the ball travels 2015 to Now in one frame, then the camera zooms in on Now
  ['now', 110], // the iris into the dark; the line rises; the ball becomes the logo and settles as the Mac comes up
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
const within = (v, [a, b]) => clamp01((v - a) / (b - a));

/* ------------------------------------------------------------------ */
/* About: "10 years", the statement typed under it, the work on the table */
/* ------------------------------------------------------------------ */

// Typing runs on time, not scroll, so a pause never leaves a word half-typed.
const KEY_MS = 30;
const keyDelay = (ch) => KEY_MS + (ch === ' ' ? 14 : 0) + (ch === ',' || ch === '.' ? 150 : 0) + Math.random() * 16;

function TypedLine({ text, on, instant, onDone, className = '' }) {
  const [n, setN] = useState(instant ? text.length : 0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (instant) {
      setN(text.length);
      return undefined;
    }
    if (!on) {
      setN(0);
      return undefined;
    }
    let i = 0;
    let id = 0;
    const step = () => {
      i += 1;
      setN(i);
      if (i < text.length) id = setTimeout(step, keyDelay(text[i - 1]));
      else doneRef.current?.();
    };
    id = setTimeout(step, KEY_MS);
    return () => clearTimeout(id);
  }, [on, instant, text]);
  const typing = on && !instant && n < text.length;
  return (
    <p className={`${styles.aboutLine} ${className}`} aria-label={text}>
      <span aria-hidden>
        {text.slice(0, n)}
        {typing && <span className={styles.caret} />}
        <span className={styles.untyped}>{text.slice(n)}</span>
      </span>
    </p>
  );
}

/** The big number: rolls up from 00 to 10 when About arrives, the same
 *  counter the timeline's year uses. */
function TenCount({ on, instant }) {
  const [n, setN] = useState(instant ? 10 : 0);
  useEffect(() => {
    if (instant) {
      setN(10);
      return undefined;
    }
    if (!on) {
      setN(0);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 1100);
      setN(Math.round(10 * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, instant]);
  return <span className={styles.ten}>{String(n).padStart(2, '0')}</span>;
}

// The statement under "10 years" (the export keeps the full sentence for
// anything that quotes it).
const STATEMENT = 'shaping brands, campaigns and interfaces.';

/* ------------------------------------------------------------------ */
/* About collage: prints land on the table as each line is typed        */
/* ------------------------------------------------------------------ */

// Pictures only, all on the right half (the words own the left). x / y / w
// in % of the panel, r in degrees, `line` = which line brings it, `d` =
// seconds after that line starts.
const COLLAGE = [
  { i: 0, x: 55, y: 12, w: 22, r: -5, line: 0, d: 0.2 },
  { i: 2, x: 75, y: 15, w: 19, r: 6, line: 0, d: 0.6 },
  { i: 1, x: 62, y: 35, w: 19, r: 3, line: 0, d: 1.0 },
  { i: 5, x: 80, y: 45, w: 16, r: -4, line: 1, d: 0.2 },
  { i: 3, x: 55, y: 60, w: 18, r: -6, line: 1, d: 0.55 },
  { i: 4, x: 73, y: 67, w: 17, r: 7, line: 1, d: 0.9 },
];

function Collage({ lines, instant }) {
  return (
    <div className={styles.collage} aria-hidden>
      {COLLAGE.map((p) => {
        const w = WORK[p.i];
        const on = instant || lines[p.line];
        return (
          <figure
            key={p.i}
            className={`${styles.collagePrint} ${on ? styles.printOn : ''} ${instant ? styles.printInstant : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, '--r': `${p.r}deg`, '--d': `${p.d}s` }}
          >
            <img src={w.src} alt="" draggable={false} />
          </figure>
        );
      })}
    </div>
  );
}

/** Words that rise out of a blur one after another as `reveal` goes 0..1. */
function RiseWords({ text, reveal, className }) {
  const words = text.split(' ');
  return (
    <motion.p className={className} style={{ '--p': reveal, '--n': words.length }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className={styles.riseWord} style={{ '--i': i }} aria-hidden>
          {w}{' '}
        </span>
      ))}
    </motion.p>
  );
}

/**
 * A panel's travel. It comes in over `enter` and leaves over `exit`; each end
 * can be horizontal ('x': in from the right, out to the left) or vertical
 * ('y': up from below, out over the top).
 */
function Panel({ progress, enter, exit, enterAxis = 'x', exitAxis = 'x', reduced, className = '', children, ...rest }) {
  const tin = (v) => (enter ? inOut(within(v, SPAN[enter])) : 1);
  const tout = (v) => (exit ? inOut(within(v, SPAN[exit])) : 0);
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

// Stop scrolling mid-journey for this long and a quiet "keep scrolling" cue appears.
const IDLE_HINT_MS = 1100;

export default function JourneyC({ mode = 'open', active = true, onReachScreen, onSkip, onClosed, phone = false }) {
  const closing = mode === 'close';
  const [reduced] = useState(prefersReducedMotion);
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
  const tlProgress = useTransform(progress, (v) => within(v, SPAN.tl));
  // The grid: a design canvas behind About and the timeline, one cell per
  // year, its lines through the ruler and the year ticks. It stays put while
  // About passes over it, then pans and zooms with the timeline's camera.
  const [tg, setTg] = useState(timelineLayout);
  useEffect(() => {
    const on = () => setTg(timelineLayout());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const gridTransform = useTransform(tlProgress, (p) => timelineCamera(tg, p));

  // "Now": the ball at Now becomes the Apple logo itself, which grows big and
  // rises to the centre while the page dims to night around it and the line
  // rises in; then the logo swivels in 3D, shrinking, and flies down onto the
  // MacBook's lid as the laptop comes up around it.
  const nowT = useTransform(progress, (v) => within(v, SPAN.now));
  const paperOpacity = useTransform(nowT, (t) => 1 - inOut(within(t, [0.14, 0.36])));
  const tlFade = useTransform(nowT, (t) => within(t, [0, 0.14]));
  const barAlpha = useTransform(nowT, (t) => 1 - within(t, [0, 0.12]));
  const lineReveal = useTransform(nowT, (t) => within(t, [0.3, 0.48]));
  const lineOpacity = useTransform(nowT, (t) => (flatRef.current ? 1 : 1 - within(t, [0.9, 1])));
  const morphT = useTransform(nowT, (t) => inOut(within(t, [0, 0.24])));
  const turnT = useTransform(nowT, (t) => inOut(within(t, [0.42, 0.8])));
  const settleT = useTransform(nowT, (t) => inOut(within(t, [0.44, 0.84])));
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
  const logoTransform = useTransform([morphT, turnT, settleT], ([k, turn, settle]) => {
    const vh = window.innerHeight;
    const x0 = tg.vw / 2;
    // Born at Now on the ruler; grows big and rises to the centre, a little high.
    const y0 = tg.rulerY + (vh * 0.42 - tg.rulerY) * k;
    const f = finalLogo();
    const [a, b, c, d] = f.m;
    // Final matrix as rotate(theta) x [[sx, sk], [0, sy]], so it can be eased.
    let theta = Math.atan2(b, a);
    if (theta < -0.01) theta += Math.PI * 2; // always turn the same way
    const sx = Math.hypot(a, b);
    const sk = Math.cos(theta) * c + Math.sin(theta) * d;
    const sy = -Math.sin(theta) * c + Math.cos(theta) * d;
    const big = (vh * (phone ? 0.2 : 0.26)) / LOGO_EL_H; // big and prominent
    const grow = 0.06 + 0.94 * k;
    const th = theta * turn;
    const ssx = (big + (sx - big) * settle) * grow;
    const ssy = (big + (sy - big) * settle) * grow;
    const ssk = sk * settle * grow;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const x = x0 + (f.x - x0) * settle;
    const y = y0 + (f.y - y0) * settle;
    // The swivel: one full turn about the vertical axis on the way down.
    const spin = 360 * turn;
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) perspective(900px) rotateY(${spin.toFixed(2)}deg) matrix(${(cos * ssx).toFixed(5)}, ${(sin * ssx).toFixed(5)}, ${(cos * ssk - sin * ssy).toFixed(5)}, ${(sin * ssk + cos * ssy).toFixed(5)}, 0, 0)`;
  });
  // The ball (Now's marker, same spot and size as the timeline's) swells as
  // the logo grows out of it, and is gone by the time the logo is whole.
  const ballTransform = useTransform(morphT, (k) => `translate(${(tg.vw / 2).toFixed(2)}px, ${tg.rulerY.toFixed(2)}px) translate(-50%, -50%) scale(${(1 + 2.5 * k).toFixed(3)})`);
  const ballOpacity = useTransform([nowT, morphT], ([t, k]) => (t > 0 ? 1 - within(k, [0.1, 0.45]) : 0));
  // Ink on paper, white as the page goes to night, then the lid's black
  // glass as the laptop comes up (phones have no lid: it stays white).
  const whiteOpacity = useTransform(nowT, (t) => within(t, [0.22, 0.28]) * (phone ? 1 : 1 - within(t, [0.68, 0.9])));
  const logoOpacity = useTransform([morphT, nowT], ([k, t]) => within(k, [0.08, 0.4]) * (flatRef.current ? 1 : 1 - within(t, [0.94, 0.99])));
  const rimOpacity = useTransform(nowT, (t) => within(t, [0.3, 0.4]) * (phone ? 1 : 1 - within(t, [0.72, 0.92])));
  const gridOpacity = useTransform(nowT, (t) => 1 - within(t, [0, 0.2]));

  useMotionValueEvent(progress, 'change', (v) => {
    // About types itself as it arrives; back on the hero it resets, so the
    // next visit types again.
    const arrive = within(v, SPAN['hero>ab']);
    if (arrive > 0.55) setLines((cur) => (cur[0] ? cur : [true, cur[1]]));
    else if (arrive <= 0) setLines((cur) => (cur[0] || cur[1] ? [false, false] : cur));
    // Scrolling on through About brings line two in early.
    if (within(v, SPAN.about) > 0.35) setLines((cur) => (cur[0] && cur[1] ? cur : [true, true]));
  });
  useMotionValueEvent(nowT, 'change', (t) => {
    const d = t > 0.26;
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

  const lineOneDone = useCallback(() => {
    later(() => setLines([true, true]), 650);
  }, []);

  const onLoaded = useCallback(() => {
    markSeen();
    setLoaded(true);
  }, []);

  // Scrolling. Three jobs, one handler (order matters):
  // 1. After Shut Down, the swipe that triggered it is still coasting: none
  //    of it may drag the page off the closing Mac.
  // 2. The timeline steps: one scroll (wheel, swipe, key, sideways swipe)
  //    moves the ball one job, whatever its length or speed; the coasting
  //    tail is swallowed. Past the last job, the page carries on.
  // 3. Elsewhere, sideways swipes scroll the page like vertical ones.
  const autoRef = useRef(false); // a glide the site is doing itself
  useEffect(() => {
    if (!active) return undefined;
    let last = 0;
    let prevMag = 0;
    let swallowUntil = 0;
    let step = -1; // the job the timeline is held on (-1: free)
    let lastY = window.scrollY;
    let gliding = false;
    let touchY = null;
    let steppedAt = 0;

    const deck = () => deckRef.current;
    const yAt = (p) => {
      const d = deck();
      const travel = d.offsetHeight - window.innerHeight;
      return d.offsetTop + travel * (SPAN.tl[0] + (SPAN.tl[1] - SPAN.tl[0]) * p);
    };
    const stops = () => timelineStops().map(yAt);
    const glide = (y, ms, then) => {
      gliding = true;
      cancelRef.current?.();
      cancelRef.current = tweenScroll(y, ms, () => {
        gliding = false;
        lastY = window.scrollY;
        then?.();
      });
    };
    const goTo = (i) => {
      const s = stops();
      if (i >= s.length) {
        // Past the last job: on to Now, the zoom, and free scrolling again.
        step = -1;
        glide(yAt(1) + 2, 1100);
      } else if (i < 0) {
        step = -1;
        glide(yAt(0) - window.innerHeight * 0.5, 900);
      } else {
        step = i;
        glide(s[i], 760);
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (!deck() || gliding || autoRef.current || closingRef.current) {
        lastY = y;
        return;
      }
      const jump = Math.abs(y - lastY) >= window.innerHeight * 1.5;
      if (step >= 0) {
        // Held on a job. A jump lets go; anything else (a touch scroll the
        // browser would not let us cancel) is eased back onto the stop.
        if (jump) step = -1;
        else if (Math.abs(y - stops()[step]) > 2) glide(stops()[step], 420);
        lastY = window.scrollY;
        return;
      }
      // Jumps (Home, End, links) pass straight through; only scrolling is caught.
      if (!jump) {
        const s = stops();
        // Free scrolling ran into the timeline: hold it on the first (or,
        // coming back up, the last) job, and drop the rest of the fling.
        if (lastY < s[0] - 1 && y >= s[0]) {
          step = 0;
          window.scrollTo(0, s[0]);
          swallowUntil = performance.now() + 1500;
          touchY = null; // the swipe that arrived here is spent
        } else if (lastY > s[s.length - 1] + 1 && y <= s[s.length - 1]) {
          step = s.length - 1;
          window.scrollTo(0, s[s.length - 1]);
          swallowUntil = performance.now() + 1500;
          touchY = null;
        }
      }
      lastY = window.scrollY;
    };

    const onWheel = (e) => {
      const t = e.timeStamp || performance.now();
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = sideways ? e.deltaX : e.deltaY;
      const mag = Math.abs(delta);
      const gap = t - last;
      const push = gap > 160 || mag > prevMag * 1.3 + 2;
      last = t;
      prevMag = mag;
      if (closingRef.current) {
        e.preventDefault();
        swallowUntil = t + 5000;
        return;
      }
      if (autoRef.current) return;
      if (swallowUntil && !push && t < swallowUntil) {
        e.preventDefault();
        return;
      }
      swallowUntil = 0;
      if (step >= 0) {
        e.preventDefault();
        // A step needs a new gesture: a pause, or a fresh push well after the
        // last step (a swipe's own ramp-up must not count as several).
        const fresh = gap > 160 || (push && t - steppedAt > 600);
        if (fresh && mag > 1) {
          steppedAt = t;
          goTo(step + Math.sign(delta));
          swallowUntil = t + 1500; // this swipe's tail moves nothing
        }
        return;
      }
      if (sideways && mag > 0.5) {
        e.preventDefault();
        window.scrollBy(0, e.deltaX * (e.deltaMode === 1 ? 16 : 1));
      }
    };

    const onTouchStart = (e) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e) => {
      if (closingRef.current || step >= 0) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      if (step < 0 || touchY == null) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      if (Math.abs(dy) > 24) goTo(step + Math.sign(dy));
    };
    const onKey = (e) => {
      if (step < 0 || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const fwd = ['ArrowDown', 'PageDown', ' ', 'ArrowRight'].includes(e.key);
      const back = ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key);
      if (!fwd && !back) return;
      e.preventDefault();
      goTo(step + (fwd ? 1 : -1));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);

  // "Keep scrolling": armed by scrolling, cleared by the next scroll. Never
  // at the very top (the hero has its own cue), nor in the Mac's room.
  useEffect(() => {
    if (!loaded || closing || !active) return undefined;
    let t;
    const arm = () => {
      setIdle(false);
      clearTimeout(t);
      const roomTop = runwayRef.current ? runwayRef.current.offsetTop : maxScroll();
      t = setTimeout(() => setIdle(window.scrollY > 4 && window.scrollY < roomTop - 4), IDLE_HINT_MS);
    };
    window.addEventListener('scroll', arm, { passive: true });
    return () => {
      window.removeEventListener('scroll', arm);
      clearTimeout(t);
      setIdle(false);
    };
  }, [loaded, closing, active]);

  const openMac = useCallback(() => {
    playShutter({ level: 0.5 });
    if (!use3D && !phone) {
      onReachScreen?.();
      return;
    }
    cancelRef.current?.();
    autoRef.current = true;
    cancelRef.current = tweenScroll(runwayRef.current?.offsetTop ?? maxScroll(), 2800, () => {
      autoRef.current = false;
    });
  }, [use3D, onReachScreen, phone]);

  // The hero's Scroll button: a glide down to About.
  const scrollToAbout = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const travel = deck.offsetHeight - window.innerHeight;
    cancelRef.current?.();
    autoRef.current = true;
    cancelRef.current = tweenScroll(deck.offsetTop + travel * SPAN.about[0], 1300, () => {
      autoRef.current = false;
    });
  }, []);

  // The laptop starts arriving, faintly, as the logo begins to turn.
  const sceneFadeFrom = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return 0;
    const travel = deck.offsetHeight - window.innerHeight;
    return deck.offsetTop + travel * (SPAN.now[0] + (SPAN.now[1] - SPAN.now[0]) * 0.45);
  }, []);

  const flat = !use3D && !phone;

  return (
    <section className={styles.journey} data-dark={dark ? 'true' : undefined} data-hero-dark={HERO_DARK ? 'true' : undefined} aria-label="Introduction">
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
        logoRef={logoRef}
      />

      <header className={styles.bar}>
        <nav className={styles.barLinks} aria-label="Quick links">
          <button type="button" className={styles.barLink} onClick={() => setContactOpen(true)}>
            Contact
          </button>
          <button type="button" className={styles.barLink} onClick={onSkip}>
            Skip intro
          </button>
        </nav>
      </header>

      <div className={styles.page}>
        <div ref={deckRef} className={styles.deck} style={{ height: `${TOTAL + 100}vh` }}>
          <div className={styles.deckSticky}>
            <motion.div className={styles.paperBg} style={{ opacity: paperOpacity }} aria-hidden />
            <motion.div className={`${styles.grid} ${lines[0] || aboutInstant ? styles.gridOn : ''}`} style={{ opacity: gridOpacity }} aria-hidden>
              <motion.div
                className={styles.gridLines}
                style={{
                  transform: gridTransform,
                  transformOrigin: timelineOrigin(tg),
                  backgroundSize: `${tg.yearW}px ${tg.yearW}px`,
                  backgroundPosition: `${tg.left % tg.yearW}px ${tg.rulerY % tg.yearW}px`,
                }}
              />
            </motion.div>

            <Panel progress={progress} exit="hero>ab" exitAxis="y" reduced={reduced} className={styles.heroPanel} aria-label="Ken">
              <Hero go={loaded} reduced={reduced} instant={closing} onOpenMac={openMac} onScrollOn={scrollToAbout} phone={phone} />
            </Panel>

            <Panel progress={progress} enter="hero>ab" enterAxis="y" exit="ab>tl" reduced={reduced} className={styles.aboutPanel} aria-label="About">
              <Collage lines={lines} instant={aboutInstant} />
              <div className={styles.aboutOne} style={tg.narrow ? undefined : { left: tg.gutter }}>
                <p className={styles.aboutName}>Kenneth Nathanael, designer in Hyderabad</p>
                <h2 className={styles.tenYears}>
                  <TenCount on={lines[0]} instant={aboutInstant} />
                  <span className={styles.years}>years</span>
                </h2>
                <TypedLine text={STATEMENT} on={lines[0]} instant={aboutInstant} onDone={lineOneDone} className={styles.aboutLead} />
                <TypedLine text={ABOUT[1]} on={lines[1]} instant={aboutInstant} className={styles.aboutSupport} />
              </div>
            </Panel>

            <Panel progress={progress} enter="ab>tl" reduced={reduced} className={styles.timelinePanel} aria-label="Career timeline">
              <TimelineC progress={tlProgress} fade={tlFade} />
            </Panel>


            <motion.div className={styles.storyLineWrap} style={{ opacity: lineOpacity }}>
              <RiseWords text={phone ? 'The rest of the story lives on my phone.' : 'The rest of the story lives on my Mac.'} reveal={lineReveal} className={styles.bridgeLine} />
              {flat && (
                <button type="button" className={styles.btnLight} onClick={() => onReachScreen?.()}>
                  Open my Mac
                </button>
              )}
            </motion.div>

            {/* A white ball born in the dark at Now; it becomes the lid's own
                Apple logo, turns, and settles as the MacBook comes up. */}
            <motion.span className={styles.ball} style={{ transform: ballTransform, opacity: ballOpacity }} aria-hidden />
            <motion.svg
              className={styles.logo}
              viewBox={`${APPLE_BOX.x} ${APPLE_BOX.y} ${APPLE_BOX.w} ${APPLE_BOX.h}`}
              style={{ width: LOGO_EL_W, height: LOGO_EL_H, transform: logoTransform, opacity: logoOpacity }}
              aria-hidden
            >
              <defs>
                <linearGradient id="lidLogoSheen" x1="0" y1="0" x2="0.4" y2="1">
                  <stop offset="0" stopColor="#4a4a54" />
                  <stop offset="0.5" stopColor={LID_LOGO_FILL} />
                  <stop offset="1" stopColor="#24242b" />
                </linearGradient>
              </defs>
              <path fill={LID_LOGO_FILL} d={APPLE_PATH} />
              <motion.g style={{ opacity: rimOpacity }}>
                <path fill="url(#lidLogoSheen)" d={APPLE_PATH} />
                <path fill="none" stroke="rgba(236, 236, 240, 0.55)" strokeWidth="0.22" d={APPLE_PATH} />
              </motion.g>
              <motion.path fill="#fff" d={APPLE_PATH} style={{ opacity: whiteOpacity }} />
            </motion.svg>

            <span className={styles.deckBar} aria-hidden>
              <motion.span style={{ scaleX: progress, opacity: barAlpha }} />
            </span>
          </div>
        </div>
        {phone ? <PhoneEnding onReach={onReachScreen} innerRef={runwayRef} /> : !flat && <div ref={runwayRef} className={styles.runway} aria-hidden />}
      </div>

      <div className={`${styles.idleHint} ${idle && !contactOpen ? styles.idleHintOn : ''}`} aria-hidden>
        <span>Keep scrolling</span>
        <i />
      </div>

      {!loaded && <Loader reduced={reduced} onDone={onLoaded} />}
      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
