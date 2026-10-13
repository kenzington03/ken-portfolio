// Journey C: Ken's own flow, from his notes (v2).
//   Loader: an aperture that opens with real load progress, facts shimmering
//   → one horizontal deck, pinned, driven by scroll. Every section leaves to
//     the left as the next arrives from the right:
//       Hero (Ken walks in, the camera fires, "Hi I'm Ken")
//       → About line 1 → About line 2 → Career timeline
//       → "The rest of the story lives on my Mac." (lights out)
//   → Build / Move / Ship: the Mac rises in and swings from overhead to the
//     front; each word tips up from behind the lid with its one-liner
//   → lid opens → welcome → macOS.
// Same contract as the other intros.

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import ContactCard from '../../Intro/ContactCard.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { POSES } from '../../Intro3/timeline.js';
import { playShutter, preloadShutter } from '../../Intro4/sfx.js';
import MacRoom from '../MacRoom.jsx';
import { WORK } from '../content.js';
import TimelineC from './TimelineC.jsx';
import PhoneEnding, { PHONE_CENTER, PHONE_RATIO, phoneWidth } from './PhoneEnding.jsx';
import styles from './JourneyC.module.css';

const EASE = [0.16, 1, 0.3, 1];
// Same file the 3D rig loads (kept as a literal so this chunk stays free of three.js).
const MODEL_SRC = '/models/macbook-rigged.glb';

// Overhead, a touch toward the viewer (straight down would flip the rig).
const OVERHEAD = { yaw: 0, pitch: 1.3, radius: 13.5, target: new THREE.Vector3(0, 0, 0.15) };
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

function Hero({ go, reduced, instant, onOpenMac, scrolled, phone }) {
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

      {/* One quiet hint for first-time visitors; gone the moment they scroll. */}
      <div className={`${styles.scrollCue} ${shot && !scrolled ? styles.scrollCueOn : ''}`} aria-hidden>
        <span>Scroll</span>
        <i />
      </div>

      {flash > 0 && <div key={flash} className={styles.flash} aria-hidden />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The deck: one pinned viewport, panels pass right-to-left on scroll  */
/* ------------------------------------------------------------------ */

// Scroll budget per beat, in viewport heights. Holds let you read; the
// `>` beats are the slides between panels.
const BEATS = [
  ['hero', 30],
  ['hero>ab', 60], // About rises from below (vertical)
  ['about', 130], // the two lines type themselves here
  ['ab>tl', 60], // About leaves left, the timeline arrives from the right
  ['tl', 140],
  ['now', 55], // the ball on the ruler travels to the centre and grows into the laptop
  ['out', 55], // lights out; the real MacBook takes its place
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
/* About: two lines that type themselves as you scroll                 */
/* ------------------------------------------------------------------ */

// About's own clock: 0 when the section is halfway in, 1 when its beat ends.
// Typing starts on that clock, so the section never arrives blank.
const aboutClock = (v) => {
  const from = SPAN['hero>ab'][0] + (SPAN['hero>ab'][1] - SPAN['hero>ab'][0]) * 0.45;
  return within(v, [from, SPAN.about[1]]);
};
// When each line is typed, on that clock.
const TYPE_SPANS = [
  [0, 0.3],
  [0.46, 0.82],
];

function TypedLine({ progress, reduced, index, className }) {
  const line = ABOUT[index];
  const [n, setN] = useState(reduced ? line.length : 0);
  useMotionValueEvent(progress, 'change', (v) => {
    const next = reduced || v >= SPAN.about[1] ? line.length : Math.round(within(aboutClock(v), TYPE_SPANS[index]) * line.length);
    setN((cur) => (cur === next ? cur : next));
  });
  const typing = !reduced && n > 0 && n < line.length;
  return (
    <p className={`${styles.aboutLine} ${className}`} aria-label={line}>
      <span aria-hidden>
        {line.slice(0, n)}
        {typing && <span className={styles.caret} />}
        <span className={styles.untyped}>{line.slice(n)}</span>
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* About collage: the work lands on the table as the lines are typed   */
/* ------------------------------------------------------------------ */

// Pictures only. x / y / w in % of the panel, r in degrees, `at` = when (on
// About's clock) each print drops in. Line one gets the cluster top-right;
// line two gets a smaller one bottom-left.
const COLLAGE = [
  { i: 0, x: 55, y: 11, w: 24, r: -5, at: 0.0 },
  { i: 2, x: 75, y: 17, w: 20, r: 6, at: 0.08 },
  { i: 1, x: 63, y: 31, w: 19, r: 3, at: 0.17 },
  { i: 5, x: 5, y: 55, w: 21, r: 4, at: 0.46 },
  { i: 3, x: 23, y: 63, w: 18, r: -6, at: 0.56 },
  { i: 4, x: 9, y: 74, w: 15, r: 8, at: 0.66 },
];

function CollagePiece({ progress, piece, reduced }) {
  const t = useTransform(progress, (v) => (reduced ? 1 : inOut(within(aboutClock(v), [piece.at, piece.at + 0.13]))));
  const y = useTransform(t, (k) => (1 - k) * 70);
  const scale = useTransform(t, (k) => 1.16 - 0.16 * k);
  const rotate = useTransform(t, (k) => piece.r + (1 - k) * (piece.r > 0 ? 9 : -9));
  const w = WORK[piece.i];
  return (
    <motion.figure className={styles.collagePrint} style={{ left: `${piece.x}%`, top: `${piece.y}%`, width: `${piece.w}%`, opacity: t, y, scale, rotate }}>
      <img src={w.src} alt="" draggable={false} />
    </motion.figure>
  );
}

function Collage({ progress, reduced }) {
  return (
    <div className={styles.collage} aria-hidden>
      {COLLAGE.map((piece) => (
        <CollagePiece key={piece.i} progress={progress} piece={piece} reduced={reduced} />
      ))}
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

export default function JourneyC({ mode = 'open', active = true, onReachScreen, onSkip, onClosed, phone = false }) {
  const closing = mode === 'close';
  const [reduced] = useState(prefersReducedMotion);
  // Phones get the iPhone ending (DOM), so they never load the 3D MacBook.
  const [use3D, setUse3D] = useState(() => !phone && hasWebGL2() && !prefersReducedMotion());
  const [loaded, setLoaded] = useState(() => closing || seenBefore());
  const [scrolled, setScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [dark, setDark] = useState(closing);
  const deckRef = useRef(null);
  const flatRef = useRef(!use3D && !phone);
  flatRef.current = !use3D && !phone;
  const runwayRef = useRef(null);
  const cancelRef = useRef(null);

  const { scrollYProgress: progress } = useScroll({ target: deckRef, offset: ['start start', 'end end'] });
  const tlProgress = useTransform(progress, (v) => within(v, SPAN.tl));
  // "Now" beat: the ruler carries on to the centre while the rest clears...
  const nowT = useTransform(progress, (v) => within(v, SPAN.now));
  const tlTail = useTransform(nowT, () => 0);
  // The ball runs along the ruler to "Now"...
  const run = useTransform(nowT, (t) => inOut(within(t, [0.04, 0.42])));
  // ...the timeline clears, and the ball becomes the laptop's lid.
  const tlFade = useTransform(nowT, (t) => within(t, [0.42, 0.7]));
  const morph = useTransform(nowT, (t) => inOut(within(t, [0.44, 1])));
  const lights = useTransform(progress, (v) => inOut(within(v, SPAN.out)));
  const paperAlpha = useTransform(lights, (t) => 1 - t);
  // Ink flips to paper quickly, early in the fade, so the text is never
  // mid-grey on a mid-grey page.
  const flip = (t) => Math.round(17 + (236 - 17) * within(t, [0.22, 0.38]));
  const inkToPaper = useTransform(lights, (t) => {
    const c = flip(t);
    return `rgb(${c} ${c} ${c})`;
  });
  const outT = useTransform(progress, (v) => within(v, SPAN.out));
  // Where the overhead MacBook sits on screen (measured: centre 59.7vh, 55vh wide, 36.7vh tall).
  // The outline matches whatever arrives next: the laptop from above, or the phone.
  const devW = () => (phone ? phoneWidth() : Math.min(window.innerHeight * 0.551, window.innerWidth * 0.86));
  const devRatio = phone ? PHONE_RATIO : 0.666;
  const devCenter = phone ? PHONE_CENTER : 0.597;
  const seedW = useTransform(morph, (m) => 12 + (devW() - 12) * m);
  const seedH = useTransform(morph, (m) => 12 + (devW() * devRatio - 12) * m);
  const seedTop = useTransform(morph, (m) => {
    const vh = window.innerHeight;
    const from = vh * 0.54 + 71; // dead centre of the ruler line
    return from + (vh * devCenter - from) * m;
  });
  // Screen x of the ruler's "Now" tick at the end of the timeline.
  const nowX = () => {
    const vw = window.innerWidth;
    const yw = Math.max(240, Math.min(360, vw * 0.23));
    return Math.min(vw * 0.9, vw * 0.34 + 1.35 * yw);
  };
  const seedLeft = useTransform([run, morph], ([r, m]) => {
    const vw = window.innerWidth;
    const atNow = vw * 0.34 + (nowX() - vw * 0.34) * r;
    return atNow + (vw * 0.5 - atNow) * m;
  });
  // The orange line follows the ball out to Now.
  const trailW = useTransform(run, (r) => (nowX() - window.innerWidth * 0.34) * r);
  const trailOpacity = useTransform(morph, (m) => 1 - within(m, [0, 0.3]));
  const seedRadius = useTransform(morph, (m) => 6 + (phone ? 30 : 12) * m);
  // Orange ball → graphite lid, the colour of the laptop it turns into.
  const seedFill = useTransform(morph, (m) => {
    const k = within(m, [0.1, 0.55]);
    return `rgb(${Math.round(255 + (24 - 255) * k)} ${Math.round(79 + (24 - 79) * k)} ${Math.round(26 + (29 - 26) * k)})`;
  });
  const seedBorder = useTransform(morph, (m) => `rgba(120, 120, 130, ${within(m, [0.5, 0.9]) * 0.55})`);
  const seedShadow = useTransform(morph, (m) => `0 ${30 * m}px ${70 * m}px -${20 * m}px rgba(17, 17, 19, ${0.5 * m})`);
  // The outline appears with Now, and hands over as the real laptop fades in.
  const seedOpacity = useTransform(outT, (o) => (flatRef.current ? 1 : 1 - within(o, [0.4, 0.8])));
  const lineOpacity = useTransform([nowT, outT], ([n, o]) => within(n, [0.55, 0.95]) * (flatRef.current ? 1 : 1 - within(o, [0.45, 0.85])));
  useMotionValueEvent(lights, 'change', (t) => {
    const d = t > 0.5;
    setDark((cur) => (cur === d ? cur : d));
  });
  useMotionValueEvent(progress, 'change', (v) => {
    if (v > 0.004) setScrolled((cur) => cur || true);
  });

  useEffect(() => {
    preloadShutter();
    return () => cancelRef.current?.();
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

  const openMac = useCallback(() => {
    playShutter({ level: 0.5 });
    if (!use3D && !phone) {
      onReachScreen?.();
      return;
    }
    cancelRef.current?.();
    cancelRef.current = tweenScroll(runwayRef.current?.offsetTop ?? maxScroll(), 2600);
  }, [use3D, onReachScreen, phone]);

  // The laptop starts arriving as the lights go down.
  const sceneFadeFrom = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return 0;
    const travel = deck.offsetHeight - window.innerHeight;
    return deck.offsetTop + travel * (SPAN.out[0] + (SPAN.out[1] - SPAN.out[0]) * 0.4);
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
        onClosed={onClosed}
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

      <div className={styles.page}>
        <div ref={deckRef} className={styles.deck} style={{ height: `${TOTAL + 100}vh` }}>
          <div className={styles.deckSticky}>
            <Panel progress={progress} exit="hero>ab" exitAxis="y" reduced={reduced} aria-label="Ken">
              <Hero go={loaded} reduced={reduced} instant={closing} onOpenMac={openMac} scrolled={scrolled} phone={phone} />
            </Panel>

            <Panel progress={progress} enter="hero>ab" enterAxis="y" exit="ab>tl" reduced={reduced} className={styles.aboutPanel}>
              <Collage progress={progress} reduced={reduced} />
              <div className={styles.aboutOne}>
                <p className={styles.aboutName}>Kenneth Nathanael, designer in Hyderabad.</p>
                <TypedLine progress={progress} reduced={reduced} index={0} className="" />
              </div>
              <TypedLine progress={progress} reduced={reduced} index={1} className={styles.aboutTwo} />
            </Panel>

            <Panel progress={progress} enter="ab>tl" reduced={reduced} className={styles.timelinePanel} aria-label="Career timeline">
              <motion.div className={styles.paperLayer} style={{ opacity: paperAlpha }} aria-hidden />
              <TimelineC progress={tlProgress} tail={tlTail} fade={tlFade} />

              <motion.span className={styles.trail} style={{ width: trailW, opacity: trailOpacity }} aria-hidden />
              {/* The ball: runs to Now, then becomes the MacBook's lid, seen from above. */}
              <motion.span
                className={styles.seed}
                style={{ width: seedW, height: seedH, top: seedTop, left: seedLeft, borderRadius: seedRadius, backgroundColor: seedFill, borderColor: seedBorder, boxShadow: seedShadow, opacity: seedOpacity }}
                aria-hidden
              />
              <motion.div className={styles.storyLineWrap} style={{ opacity: lineOpacity }}>
                <motion.p className={styles.bridgeLine} style={{ color: inkToPaper }}>
                  {phone ? 'The rest of the story lives on my phone.' : 'The rest of the story lives on my Mac.'}
                </motion.p>
                {flat && (
                  <button type="button" className={styles.btn} onClick={() => onReachScreen?.()}>
                    Open my Mac
                  </button>
                )}
              </motion.div>
            </Panel>

            <span className={styles.deckBar} aria-hidden>
              <motion.span style={{ scaleX: progress, opacity: paperAlpha }} />
            </span>
          </div>
        </div>
        {phone ? <PhoneEnding onReach={onReachScreen} innerRef={runwayRef} /> : !flat && <div ref={runwayRef} className={styles.runway} aria-hidden />}
      </div>

      {!loaded && <Loader reduced={reduced} onDone={onLoaded} />}
      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
