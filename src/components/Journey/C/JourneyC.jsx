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

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import ContactCard from '../../Intro/ContactCard.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { CHAPTER_STOPS, POSES } from '../../Intro3/timeline.js';
import { playShutter, preloadShutter } from './sfx.js';
import MacRoom from '../MacRoom.jsx';
import TimelineC, { TIMELINE_NOW, timelineGrid, timelineLayout, timelineStops } from './TimelineC.jsx';
import PhoneEnding, { PHONE_STOPS, phoneLogoPoint } from './PhoneEnding.jsx';
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

// Things to read while it loads: a little about Ken, a little design humour.
// They come in a shuffled order, so a second visit reads differently.
const LOADING = [
  '31 pani puris in one minute. Personal best.',
  'Hobbies: basketball, music, chess.',
  'Still trying to bring back Pokémon Go from 2016.',
  'Kerning the loading text. Please hold.',
  'Making the logo bigger, as requested.',
  'No Comic Sans was harmed in this website.',
  'One does not simply skip the loading screen.',
  'Cmd+Z is my love language.',
  'Exporting final_final_v3.psd',
  'May the fonts be with you.',
  'Hold my chai.',
  'It is not a bug. It is a feature.',
];
const shuffled = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const LINE_MS = 1500;
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

function Loader({ reduced, onDone }) {
  const real = useAssetProgress(true);
  const [shown, setShown] = useState(0);
  const [lines] = useState(() => shuffled(LOADING));
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
          setTimeout(() => setOut(true), reduced ? 120 : 260);
          setTimeout(onDone, reduced ? 200 : 820);
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
  const text = lines[line];
  return (
    <div className={`${styles.loader} ${out ? styles.loaderOut : ''}`} role="status" aria-label={`Loading, ${pct} percent`}>
      <div className={styles.loaderLine} aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={text}
            className={styles.loaderText}
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>
      {/* Real progress (fonts, the hero clip, the MacBook): one hairline. */}
      <span className={styles.loaderBar} aria-hidden>
        <span style={{ transform: `scaleX(${shown.toFixed(4)})` }} />
      </span>
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
const sineInOut = (t) => (1 - Math.cos(Math.PI * t)) / 2;
const sineOut = (t) => Math.sin((Math.PI * t) / 2);
const smooth01 = (t) => t * t * (3 - 2 * t);
const within = (v, [a, b]) => clamp01((v - a) / (b - a));

/* ------------------------------------------------------------------ */
/* About: "10 years", the statement typed under it, the work on the table */
/* ------------------------------------------------------------------ */

// Typing runs on time, not scroll, so a pause never leaves a word half-typed.
// About, Apple style: who, the promise, then the work fanned out like a
// hand of cards. Everything starts as About slides in; nothing is typed.
const ABOUT_HEAD = 'Ten years of making brands feel like themselves.';
const ABOUT_SUB =
  'Identity, campaigns, motion and interfaces, designed as one system, so a brand looks and sounds like itself everywhere it shows up.';
const FAN = [
  { src: '/assets/about/milestone-stationery.jpg', alt: 'Milestone Technologies stationery' },
  { src: '/assets/about/fluid-brain.jpg', alt: 'Fluid AI brand artwork' },
  { src: '/assets/about/lebron-nike.jpg', alt: 'LeBron James campaign artwork for Nike' },
  { src: '/assets/about/uvu-brand.jpg', alt: 'Project UVU brand rollout' },
  { src: '/assets/about/aloft-morrison.jpg', alt: 'Jim Morrison poster for Aloft hotels' },
];

function AboutPanel({ on, instant }) {
  const words = ABOUT_HEAD.split(' ');
  const mid = (FAN.length - 1) / 2;
  return (
    <div className={`${styles.about} ${on || instant ? styles.aboutOn : ''} ${instant ? styles.aboutInstant : ''}`}>
      <p className={styles.aboutName}>Kenneth Nathanael, designer in Hyderabad</p>
      <h2 className={styles.aboutHead} aria-label={ABOUT_HEAD}>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className={styles.headWord} style={{ '--i': i }} aria-hidden>
              <span>{w}</span>
            </span>{' '}
          </Fragment>
        ))}
      </h2>
      <p className={styles.aboutSub}>{ABOUT_SUB}</p>
      <div className={styles.fan}>
        {FAN.map((c, i) => {
          const k = i - mid;
          return (
            <figure key={c.src} className={styles.card} style={{ '--k': k, '--ak': Math.abs(k), '--i': i, zIndex: 10 - Math.abs(k) }}>
              <img src={c.src} alt={c.alt} draggable={false} />
            </figure>
          );
        })}
      </div>
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

// Stop scrolling mid-journey for this long and a quiet "keep scrolling" cue appears.
const IDLE_HINT_MS = 900;

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
  const gridSize = useTransform(tlProgress, (p) => timelineGrid(tg, p).size);
  const gridPosition = useTransform(tlProgress, (p) => timelineGrid(tg, p).position);

  // "Now", in two beats (the journey rests between them).
  //  1. The ball at Now becomes the Apple logo and grows a little, and "The
  //     rest of the story lives on my Mac." rises with it, ink on paper.
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
  const DISSOLVE = [0.36, 0.76];
  const mid = (DISSOLVE[0] + DISSOLVE[1]) / 2;
  const paperOpacity = useTransform(nowT, (t) => 1 - smooth01(within(t, DISSOLVE)));
  const tlFade = useTransform(nowT, (t) => within(t, [0, 0.12]));
  const barAlpha = useTransform(nowT, (t) => 1 - within(t, [0, 0.12]));
  const lineReveal = useTransform(nowT, (t) => within(t, [0.14, 0.31]));
  const lineOpacity = useTransform(nowT, (t) => (flatRef.current ? 1 : 1 - within(t, [0.93, 1])));
  // Ink on paper, white on night: it flips as the page crosses the middle.
  const lineColor = useTransform(nowT, (t) => {
    const k = within(t, [mid - 0.02, mid + 0.02]);
    const c = Math.round(18 + (236 - 18) * k);
    return `rgb(${c}, ${c}, ${Math.round(20 + (234 - 20) * k)})`;
  });
  // The glides do the easing; these stay gentle so nothing is rushed.
  const morphT = useTransform(nowT, (t) => smooth01(within(t, [0, 0.17])));
  const growT = useTransform(nowT, (t) => smooth01(within(t, [0.12, 0.31])));
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
  const logoTransform = useTransform([morphT, growT, placeT, settleT], ([k, grow, place, settle]) => {
    const vh = window.innerHeight;
    // Born at Now, on the ruler.
    const x0 = tg.vw / 2;
    const y0 = tg.rulerY;
    const f = finalLogo();
    const [a, b, c, d] = f.m;
    // Final matrix as rotate(theta) x [[sx, sk], [0, sy]], so it can be eased.
    let theta = Math.atan2(b, a);
    if (theta < -0.01) theta += Math.PI * 2; // always turn the same way
    const sx = Math.hypot(a, b);
    const sk = Math.cos(theta) * c + Math.sin(theta) * d;
    const sy = -Math.sin(theta) * c + Math.cos(theta) * d;
    // Formed a little larger than the lid's logo, then grows a touch more.
    const base = (vh * (phone ? 0.075 : 0.085)) / LOGO_EL_H;
    const big = (vh * (phone ? 0.1 : 0.125)) / LOGO_EL_H;
    const start = (base + (big - base) * grow) * (0.3 + 0.7 * k);
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
  // The ball (Now's marker, same spot and size as the timeline's) swells a
  // touch as the logo grows out of it, and is gone once the logo is whole.
  const ballTransform = useTransform(morphT, (k) => `translate(${(tg.vw / 2).toFixed(2)}px, ${tg.rulerY.toFixed(2)}px) translate(-50%, -50%) scale(${(1 + 1.6 * k).toFixed(3)})`);
  const ballOpacity = useTransform([nowT, morphT], ([t, k]) => (t > 0 ? 1 - within(k, [0.15, 0.5]) : 0));
  // Without a lid to land on, the logo turns white with the line.
  const whiteOpacity = useTransform(nowT, (t) => (hasLid() ? 0 : within(t, [mid - 0.02, mid + 0.02])));
  const logoOpacity = useTransform([morphT, nowT], ([k, t]) => within(k, [0.1, 0.45]) * (flatRef.current ? 1 : 1 - within(t, [0.94, 0.99])));
  const gridOpacity = useTransform(nowT, (t) => 1 - within(t, [0, 0.2]));

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
  const goToIdRef = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
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
    const stops = () => {
      if (!deckRef.current) return [];
      const list = [
        { id: 'hero', y: deckAt(0) },
        { id: 'about', y: spanAt(SPAN.about, 0.4), ms: 1600 },
        // The timeline arrives whole, rests a beat, then the camera closes in
        // on the ball: one scroll, two legs.
        ...timelineStops().map((p, i) => ({
          id: `role${i}`,
          y: spanAt(SPAN.tl, p),
          ...(i === 0 ? { ms: 1500, via: { y: spanAt(SPAN.tl, 0), ms: 1500, rest: 380 } } : {}),
        })),
        // From the last role: on to Now as the camera pulls back over the
        // whole journey. Then it closes in on Now and, slowly, the ball
        // becomes the logo as the line rises.
        { id: 'now', y: spanAt(SPAN.tl, TIMELINE_NOW), ms: 2000 },
        { id: 'logo', y: spanAt(SPAN.now, 0.31), ms: 3000, via: { y: spanAt(SPAN.tl, 1), ms: 1300 } },
        { id: 'mac', y: spanAt(SPAN.now, 0.88), ms: 3000 },
      ];
      if (runwayRef.current) (phone ? PHONE_STOPS : CHAPTER_STOPS).forEach((t, i) => list.push({ id: `chapter${i}`, y: runAt(t), ms: 1300 }));
      return list;
    };
    const glide = (y, ms, via) => {
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
      };
      // Glides ease gently (sine), so what they carry (a section changing,
      // the ball becoming the logo, the page becoming the laptop) is spread
      // over the whole glide instead of rushed through its middle.
      const curve = sineInOut;
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
        glide(end + 2, 2600);
        return;
      }
      const prev = step >= 0 ? step : nearest(s, window.scrollY);
      step = i;
      // Neighbouring stops can ask for their own pace (the logo and the
      // laptop take their time), in both directions.
      const paced = Math.abs(i - prev) === 1 ? (i > prev ? s[i].ms : s[prev].ms) : null;
      const via = i === prev + 1 ? s[i].via : null;
      glide(s[i].y, msOverride ?? paced ?? msFor(window.scrollY, s[i].y), via);
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
    goToIdRef.current = (id, ms) => {
      const i = stops().findIndex((x) => x.id === id);
      if (i >= 0) goTo(i, ms);
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
        gestureSpent = gliding;
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
      // input that arrives meanwhile is dropped, not queued.
      if (gliding) {
        gestureSpent = true;
        e.preventDefault();
        return;
      }
      if (inRange(stops(), window.scrollY)) {
        e.preventDefault();
        if (!gestureSpent && gestureSure && gestureSum >= 30) {
          gestureSpent = true;
          steppedAt = t;
          goTo(next(Math.sign(delta)));
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
      if (Math.abs(dy) > 24 && !gliding && engaged()) goTo(next(Math.sign(dy)));
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
      if (!gliding) goTo(next(fwd ? 1 : -1));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(settleTimer);
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
    goToIdRef.current?.('mac', 2800);
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
  const sceneFadeTo = useCallback(() => nowY(0.8), [nowY]);

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
        sceneFadeTo={sceneFadeTo}
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
                style={{ backgroundSize: gridSize, backgroundPosition: gridPosition }}
              />
            </motion.div>

            <Panel progress={progress} exit="hero>ab" exitAxis="y" reduced={reduced} className={styles.heroPanel} aria-label="Ken">
              <Hero go={loaded} reduced={reduced} instant={closing} onOpenMac={openMac} onScrollOn={scrollToAbout} phone={phone} />
            </Panel>

            <Panel progress={progress} enter="hero>ab" enterAxis="y" exit="ab>tl" reduced={reduced} className={styles.aboutPanel} aria-label="About">
              <AboutPanel on={lines[0]} instant={aboutInstant} />
            </Panel>

            <Panel progress={progress} enter="ab>tl" reduced={reduced} className={styles.timelinePanel} aria-label="Career timeline">
              <TimelineC progress={tlProgress} fade={tlFade} />
            </Panel>


            <motion.div className={styles.storyLineWrap} style={{ opacity: lineOpacity, color: lineColor }}>
              <RiseWords text={phone ? 'The rest of the story lives on my phone.' : 'The rest of the story lives on my Mac.'} reveal={lineReveal} className={styles.bridgeLine} />
              {flat && (
                <button type="button" className={styles.btnLight} onClick={() => onReachScreen?.()}>
                  Open my Mac
                </button>
              )}
            </motion.div>

            {/* Now's ball becomes the lid's own Apple logo and settles onto it
                as the MacBook comes up underneath. */}
            <motion.span className={styles.ball} style={{ transform: ballTransform, opacity: ballOpacity }} aria-hidden />
            <motion.svg
              className={styles.logo}
              viewBox={`${APPLE_BOX.x} ${APPLE_BOX.y} ${APPLE_BOX.w} ${APPLE_BOX.h}`}
              style={{ width: LOGO_EL_W, height: LOGO_EL_H, transform: logoTransform, opacity: logoOpacity }}
              aria-hidden
            >
              <path fill={LID_LOGO_FILL} d={APPLE_PATH} />
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
