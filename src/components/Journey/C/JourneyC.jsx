// Journey C: Ken's own flow, from his notes (v3). One camera, start to end:
//   Loader: the lens iris opens with real load progress.
//   Hero, on white: Ken walks in, the shutter fires, he stands for the photo.
//   First scroll: he puts his hand over the lens and the frame goes black
//     (no scrolled transition: the gesture is the cut).
//   In the dark, a pinned deck driven by scroll:
//       About: the two lines type themselves and the prints develop
//       → Career timeline, ending with Now dead centre
//       → the MacBook appears there; the ball sinks into its logo
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
import TimelineC from './TimelineC.jsx';
import PhoneEnding, { PHONE_CENTER } from './PhoneEnding.jsx';
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

// THE LENS COVER: plays on the first scroll, full screen, until the frame is
// black. With Ken's own footage this is the same take continued (point `src`
// at it and set `from`/`to` to the reach and the moment the palm seals the
// lens). The current file is a stand-in: a Pexels palm, reversed.
const COVER = {
  src: '/assets/hero/walkin/stock-cover.mp4',
  from: 0.3,
  to: 2.05,
  rate: 1.15,
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
    const parts = { fonts: 0, video: 0, cover: 0, model: 0 };
    const push = () => live && setP(parts.fonts * 0.15 + parts.video * 0.25 + parts.cover * 0.1 + parts.model * 0.5);
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
    stream(COVER.src, 'cover');
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

function Hero({ go, reduced, instant, onOpenMac, cue, phone }) {
  const [shot, setShot] = useState(!!instant);
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

      <div className={styles.heroCopy}>
        <h1 className={styles.hello}>
          <motion.span className={styles.hi} {...rise(0.05)}>
            Hi I&apos;m
          </motion.span>
          {/* One designer's gesture, played once: the pen draws the outline,
              the fill drops in, the kerning tightens, and the selection box
              shows the file it lives in. Then the tools step back. */}
          <span className={`${styles.kenWrap} ${go || instant || reduced ? styles.kenDraw : ''} ${shot ? styles.kenSet : ''}`}>
            <span className={styles.ken}>
              <span>K</span>
              <span>e</span>
              <span>n</span>
            </span>
            <span className={styles.selBox} aria-hidden>
              <i />
              <i />
              <i />
              <i />
              <b>
                <u />
                Ken_final_v7.fig
                <em>Kerning 0</em>
              </b>
            </span>
          </span>
        </h1>
        <motion.div className={styles.heroMeta} {...rise(0.5)}>
          <p className={styles.role}>Designer</p>
          <p className={styles.tagline}>Trial and error, but mostly error.</p>
        </motion.div>
        <motion.div className={styles.heroActions} {...rise(0.65)}>
          <button type="button" className={styles.btn} onClick={onOpenMac}>
            {phone ? 'Open my iPhone' : 'Open my Mac'}
          </button>
        </motion.div>
      </div>

      {/* One quiet hint; gone the moment they scroll. */}
      <div className={`${styles.scrollCue} ${shot && cue ? styles.scrollCueOn : ''}`} aria-hidden>
        <span>Scroll</span>
        <i />
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
  ['about', 100], // both lines type on their own; scrolling on hurries line two
  ['ab>tl', 60], // About leaves left, the timeline arrives from the right
  ['tl', 150], // ends with Now dead centre, on the orange line
  ['now', 70], // the timeline clears; the MacBook appears where Now was, the ball sinks into its logo
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
/* About: two lines that type themselves, in the dark                  */
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

/* ------------------------------------------------------------------ */
/* About collage: prints develop in the dark as each line is typed     */
/* ------------------------------------------------------------------ */

// Pictures only. x / y / w in % of the panel, r in degrees, `line` = which
// line brings it, `d` = seconds after that line starts. Line one gets the
// cluster top-right; line two a smaller one bottom-left.
const COLLAGE = [
  { i: 0, x: 55, y: 11, w: 24, r: -5, line: 0, d: 0.2 },
  { i: 2, x: 75, y: 17, w: 20, r: 6, line: 0, d: 0.65 },
  { i: 1, x: 63, y: 31, w: 19, r: 3, line: 0, d: 1.1 },
  { i: 5, x: 5, y: 55, w: 21, r: 4, line: 1, d: 0.2 },
  { i: 3, x: 23, y: 63, w: 18, r: -6, line: 1, d: 0.65 },
  { i: 4, x: 9, y: 74, w: 15, r: 8, line: 1, d: 1.1 },
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

// Stop scrolling mid-journey for this long and a quiet "keep scrolling" cue appears.
const IDLE_HINT_MS = 1100;
// A wheel event this long after the last one starts a new gesture (trackpad
// momentum arrives in an unbroken stream, so it never counts as a new one).
const GESTURE_GAP_MS = 160;
const UNCOVER_MS = 900;

export default function JourneyC({ mode = 'open', active = true, onReachScreen, onSkip, onClosed, phone = false }) {
  const closing = mode === 'close';
  const [reduced] = useState(prefersReducedMotion);
  // Phones get the iPhone ending (DOM), so they never load the 3D MacBook.
  const [use3D, setUse3D] = useState(() => !phone && hasWebGL2() && !prefersReducedMotion());
  const [loaded, setLoaded] = useState(() => closing || seenBefore());
  // 'hero' (on white, scroll locked) → 'covering' (the hand) → 'deck' (in the
  // dark, scrolling). Going back up from the top of the deck: 'uncovering'.
  const [stage, setStageState] = useState(() => (closing || window.scrollY > 4 ? 'deck' : 'hero'));
  const stageRef = useRef(stage);
  const setStage = useCallback((s) => {
    stageRef.current = s;
    setStageState(s);
  }, []);
  const [lines, setLines] = useState([false, false]);
  const [contactOpen, setContactOpen] = useState(false);
  const contactRef = useRef(false);
  contactRef.current = contactOpen;
  const [idle, setIdle] = useState(false);
  const deckRef = useRef(null);
  const flatRef = useRef(!use3D && !phone);
  flatRef.current = !use3D && !phone;
  const runwayRef = useRef(null);
  const cancelRef = useRef(null);
  const coverRef = useRef(null);
  const blackRef = useRef(null);
  const timersRef = useRef([]);
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
  // "Now" beat: the timeline clears, the MacBook fades in where Now was, and
  // the ball (Now's marker) drops into the lid and dissolves at the logo.
  const nowT = useTransform(progress, (v) => within(v, SPAN.now));
  const tlFade = useTransform(nowT, (t) => within(t, [0, 0.4]));
  const sink = useTransform(nowT, (t) => inOut(within(t, [0.25, 0.85])));
  const barAlpha = useTransform(nowT, (t) => 1 - inOut(within(t, [0.5, 1])));
  // Where the MacBook's logo (or the phone) sits on screen, as a fraction of the viewport height.
  const devCenter = phone ? PHONE_CENTER : 0.633; // the Apple logo, measured at 1440x900
  const seedTop = useTransform(sink, (m) => {
    const vh = window.innerHeight;
    const from = vh * 0.54 + 71; // dead centre of the ruler line
    return from + (vh * devCenter - from) * m;
  });
  const seedSize = useTransform(sink, (m) => 12 - 6 * m);
  const seedOpacity = useTransform(sink, (m) => (flatRef.current ? 1 : 1 - within(m, [0.45, 1])));
  const lineOpacity = useTransform(nowT, (t) => within(t, [0.3, 0.6]));

  // Scrolling on through About brings line two in early (and line one, if a
  // visitor somehow got here without it).
  useMotionValueEvent(progress, 'change', (v) => {
    if (stageRef.current !== 'deck') return;
    const k = within(v, SPAN.about);
    if (k > 0.3) setLines((cur) => (cur[0] && cur[1] ? cur : [true, true]));
  });

  useEffect(() => {
    preloadShutter();
    const timers = timersRef.current;
    return () => {
      cancelRef.current?.();
      timers.forEach(clearTimeout);
    };
  }, []);

  // Only the deck scrolls. Under the loader and on the hero the page is held.
  const locked = !loaded || stage !== 'deck';
  useEffect(() => {
    if (!locked) return undefined;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    if (stageRef.current !== 'deck') window.scrollTo(0, 0);
    return () => {
      root.style.overflow = prev;
    };
  }, [locked]);

  // In the dark, line one starts as soon as the frame is black; line two
  // follows it. Back on the hero, both reset so the next visit types again.
  useEffect(() => {
    if (stage === 'hero') {
      setLines([false, false]);
      return undefined;
    }
    if (stage !== 'deck') return undefined;
    const t = setTimeout(() => setLines((cur) => (cur[0] ? cur : [true, cur[1]])), aboutInstant ? 0 : 280);
    return () => clearTimeout(t);
  }, [stage, aboutInstant]);
  const lineOneDone = useCallback(() => {
    later(() => setLines([true, true]), 650);
  }, []);

  const onLoaded = useCallback(() => {
    markSeen();
    setLoaded(true);
  }, []);

  /** The hand over the lens: the clip plays full screen until the frame is black. */
  const cover = useCallback(
    (then) => {
      if (stageRef.current !== 'hero') return;
      setStage('covering');
      const v = coverRef.current;
      const black = blackRef.current;
      let raf = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        if (black) black.style.opacity = '1';
        if (v) {
          v.pause();
          v.style.opacity = '0';
        }
        setStage('deck');
        then?.();
      };
      if (black) black.style.transition = 'none';
      if (reduced || !v) {
        if (black) {
          black.style.transition = 'opacity 420ms ease';
          black.style.opacity = '1';
        }
        later(finish, 440);
        return;
      }
      const tick = () => {
        const k = within(v.currentTime, [COVER.from, COVER.to]);
        // The palm comes up into frame (a touch of push as it nears the lens).
        v.style.opacity = String(inOut(within(k, [0, 0.2])));
        v.style.transform = `scale(${1.12 - 0.12 * inOut(within(k, [0, 0.5]))})`;
        if (black) black.style.opacity = String(inOut(within(k, [0.48, 0.94])));
        if (k >= 1 || v.ended) finish();
        else raf = requestAnimationFrame(tick);
      };
      v.currentTime = COVER.from;
      v.playbackRate = COVER.rate;
      v.play().then(
        () => {
          raf = requestAnimationFrame(tick);
        },
        () => {
          if (black) {
            black.style.transition = 'opacity 420ms ease';
            black.style.opacity = '1';
          }
          later(finish, 440);
        },
      );
      // Never strand anyone on a clip that stalls.
      later(finish, ((COVER.to - COVER.from) / COVER.rate) * 1000 + 1400);
    },
    [reduced, setStage],
  );

  /** Back up past the top of the deck: out of the dark, onto the photo. */
  const uncover = useCallback(() => {
    if (stageRef.current !== 'deck') return;
    cancelRef.current?.();
    const black = blackRef.current;
    if (black) {
      black.style.transition = 'none';
      black.style.opacity = '1';
    }
    window.scrollTo(0, 0);
    setStage('uncovering');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!black) return;
        black.style.transition = `opacity ${reduced ? 300 : UNCOVER_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        black.style.opacity = '0';
      }),
    );
    later(() => setStage('hero'), reduced ? 320 : UNCOVER_MS + 20);
  }, [reduced, setStage]);

  // The gate: on the hero, the first scroll (wheel, swipe or key) is the cue
  // for the hand; at the very top of the deck, a fresh scroll up brings the
  // photo back. Momentum from the gesture that triggered either is swallowed.
  useEffect(() => {
    if (!loaded || !active) return undefined;
    let last = 0;
    let acc = 0;
    let startTop = false;
    let swallow = false;
    let touchY = null;
    const atTop = () => window.scrollY <= 1;
    const onWheel = (e) => {
      const t = performance.now();
      const gap = t - last;
      last = t;
      if (gap > GESTURE_GAP_MS) {
        acc = 0;
        swallow = false;
        startTop = atTop();
      }
      // After Shut Down, the swipe that triggered it is still coasting: none of
      // it may drag the page off the closing Mac (nor right after it rests).
      if (closingRef.current) {
        e.preventDefault();
        swallow = true;
        return;
      }
      const s = stageRef.current;
      if (contactRef.current) return;
      if (swallow || s === 'covering' || s === 'uncovering') {
        e.preventDefault();
        return;
      }
      if (s === 'hero') {
        e.preventDefault();
        acc += e.deltaY;
        if (acc > 24) {
          swallow = true;
          cover();
        }
        return;
      }
      if (startTop && atTop() && e.deltaY < 0) {
        acc += e.deltaY;
        if (acc < -40) {
          swallow = true;
          e.preventDefault();
          uncover();
        }
      }
    };
    const onTouchStart = (e) => {
      touchY = e.touches[0]?.clientY ?? null;
      startTop = atTop();
    };
    const onTouchMove = (e) => {
      if (closingRef.current) {
        e.preventDefault();
        return;
      }
      const s = stageRef.current;
      if (contactRef.current) return;
      if (s !== 'deck') e.preventDefault();
      if (touchY == null) return;
      const dy = (e.touches[0]?.clientY ?? touchY) - touchY;
      if (s === 'hero' && dy < -28) {
        touchY = null;
        cover();
      } else if (s === 'deck' && startTop && atTop() && dy > 64) {
        touchY = null;
        uncover();
      }
    };
    const onKey = (e) => {
      if (contactRef.current || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.key === ' ' && (tag === 'BUTTON' || tag === 'A'))) return;
      const s = stageRef.current;
      if (s === 'hero' && ['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key)) {
        e.preventDefault();
        cover();
      } else if (s === 'deck' && atTop() && ['ArrowUp', 'PageUp', 'Home'].includes(e.key)) {
        e.preventDefault();
        uncover();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [loaded, active, cover, uncover]);

  // "Keep scrolling": armed by scrolling in the deck, cleared by the next
  // scroll. Never at the very top or bottom (the hero has its own cue).
  useEffect(() => {
    if (!loaded || closing || !active || stage !== 'deck') return undefined;
    let t;
    const arm = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(window.scrollY > 4 && window.scrollY < maxScroll() - 4), IDLE_HINT_MS);
    };
    window.addEventListener('scroll', arm, { passive: true });
    return () => {
      window.removeEventListener('scroll', arm);
      clearTimeout(t);
      setIdle(false);
    };
  }, [loaded, closing, active, stage]);

  const openMac = useCallback(() => {
    playShutter({ level: 0.5 });
    const go = () => {
      if (!use3D && !phone) {
        onReachScreen?.();
        return;
      }
      cancelRef.current?.();
      cancelRef.current = tweenScroll(runwayRef.current?.offsetTop ?? maxScroll(), 2600);
    };
    // From the hero the hand still covers the lens first: one continuous take.
    if (stageRef.current === 'hero') cover(() => requestAnimationFrame(go));
    else go();
  }, [use3D, onReachScreen, phone, cover]);

  // The laptop starts arriving as the outline hands over.
  const sceneFadeFrom = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return 0;
    const travel = deck.offsetHeight - window.innerHeight;
    return deck.offsetTop + travel * (SPAN.now[0] + (SPAN.now[1] - SPAN.now[0]) * 0.2);
  }, []);

  const flat = !use3D && !phone;
  const heroShown = stage !== 'deck';

  return (
    <section className={styles.journey} data-dark={stage === 'deck' || stage === 'covering' ? 'true' : undefined} data-hero-dark={HERO_DARK ? 'true' : undefined} aria-label="Introduction">
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

      {/* Under the photo, the dark deck is out of reach (focus, screen readers). */}
      <div className={styles.page} inert={heroShown || undefined}>
        <div ref={deckRef} className={styles.deck} style={{ height: `${TOTAL + 100}vh` }}>
          <div className={styles.deckSticky}>
            <Panel progress={progress} exit="ab>tl" reduced={reduced} className={styles.aboutPanel} aria-label="About">
              <Collage lines={lines} instant={aboutInstant} />
              <div className={styles.aboutOne}>
                <p className={styles.aboutName}>Kenneth Nathanael, designer in Hyderabad.</p>
                <TypedLine text={ABOUT[0]} on={lines[0]} instant={aboutInstant} onDone={lineOneDone} />
              </div>
              <TypedLine text={ABOUT[1]} on={lines[1]} instant={aboutInstant} className={styles.aboutTwo} />
            </Panel>

            <Panel progress={progress} enter="ab>tl" reduced={reduced} className={styles.timelinePanel} aria-label="Career timeline">
              <TimelineC progress={tlProgress} fade={tlFade} />

              {/* The ball: marks where you are; at Now it sinks into the MacBook's logo. */}
              <motion.span className={styles.seed} style={{ width: seedSize, height: seedSize, top: seedTop, opacity: seedOpacity }} aria-hidden />
              <motion.div className={styles.storyLineWrap} style={{ opacity: lineOpacity }}>
                <p className={styles.bridgeLine}>{phone ? 'The rest of the story lives on my phone.' : 'The rest of the story lives on my Mac.'}</p>
                {flat && (
                  <button type="button" className={styles.btn} onClick={() => onReachScreen?.()}>
                    Open my Mac
                  </button>
                )}
              </motion.div>
            </Panel>

            <span className={styles.deckBar} aria-hidden>
              <motion.span style={{ scaleX: progress, opacity: barAlpha }} />
            </span>
          </div>
        </div>
        {phone ? <PhoneEnding onReach={onReachScreen} innerRef={runwayRef} /> : !flat && <div ref={runwayRef} className={styles.runway} aria-hidden />}
      </div>

      {/* The photo, held above the deck until the hand covers the lens. */}
      <div className={`${styles.heroLayer} ${heroShown ? '' : styles.heroLayerOff}`} aria-hidden={!heroShown || undefined}>
        <Hero go={loaded} reduced={reduced} instant={closing} onOpenMac={openMac} cue={stage === 'hero'} phone={phone} />
        <video ref={coverRef} className={styles.coverClip} src={COVER.src} muted playsInline preload="auto" aria-hidden />
        <div ref={blackRef} className={styles.coverBlack} aria-hidden />
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
