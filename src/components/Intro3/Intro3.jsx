// Hero v3: loader → Ken walks in, freezes, shutter, name → "get to know me"
// (story, horizontal timeline, proof) → bridge → the MacBook sequence from v2
// (rotate + colour chapters, lid, dive) → the existing welcome + macOS.
// Same contract as <Intro>/<Intro2> so App's flow (welcome, Shut Down) is shared.
//
// One native scroll drives everything. The 3D room is a fixed layer behind the
// page; the Mac gets its own runway at the end, so `macProgress` (0..1 over
// that runway) feeds the unchanged Rig.

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ContactCard from '../Intro/ContactCard.jsx';
import HeroName from '../Intro/hero/HeroName.jsx';
import MagneticButton from '../Intro/hero/MagneticButton.jsx';
import heroStyles from '../Intro/hero/hero.module.css';
import {
  ArrowDown,
  SceneBoundary,
  hasWebGL2,
  maxScroll,
  prefersReducedMotion,
  tweenScroll,
} from '../Intro/shared.jsx';
import Loader from '../Intro2/Loader.jsx';
import SoundToggle from '../Intro2/SoundToggle.jsx';
import { Ambient } from '../Intro2/ambient.js';
import { POSITIONING } from '../../data/about.js';
import HeroScreenshot from './hero/HeroScreenshot.jsx';
import HeroBooth from './hero/HeroBooth.jsx';
import { playShutter, preloadShutter, primeShutter } from './hero/shutter.js';
import Story from './sections/Story.jsx';
import Timeline from './sections/Timeline.jsx';
import Proof from './sections/Proof.jsx';
import Bridge from './sections/Bridge.jsx';
import { CHAPTERS, HANDOFF_AT, chapterAt, ease, ramp, roomColor } from './timeline.js';
import styles from './Intro3.module.css';

const World = lazy(() => import('./World.jsx'));

const CLOSE_MS = 3600;
// Resume stays hidden until public/cv.pdf is a real file (it is a 452-byte stub).
const SHOW_RESUME = false;

const NAV = [
  { id: 'hero', label: 'Hello' },
  { id: 'story', label: 'Story' },
  { id: 'timeline', label: 'Experience' },
  { id: 'proof', label: 'Proof' },
  { id: 'mac', label: 'The Mac' },
];

// Two hero concepts while Ken chooses: ?hero=a (Screenshot, default) or ?hero=b (Photo Booth).
const HERO_VARIANT =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('hero') === 'b' ? 'b' : 'a';
// Drop the real walk-in here once it exists (public/assets/hero/walkin/).
const HERO_VIDEO = { src: undefined, poster: undefined };

const clamp01 = (v) => Math.min(1, Math.max(0, v));

const rise = (delay, reduced) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay },
      };

export default function Intro3({ mode = 'open', active = true, onReachScreen, onSkip, onClosed }) {
  const closing = mode === 'close';
  const [reduced] = useState(prefersReducedMotion);
  // Reduced motion gets the flat path too: no 3D room, a button instead of the runway.
  const [use3D, setUse3D] = useState(() => hasWebGL2() && !prefersReducedMotion());
  const [entered, setEntered] = useState(closing);
  const [loaderGone, setLoaderGone] = useState(closing);
  const [heroGo, setHeroGo] = useState(closing);
  const [nameIn, setNameIn] = useState(closing);
  const [soundOn, setSoundOn] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [navIndex, setNavIndex] = useState(0);

  const ambient = useRef(null);
  if (!ambient.current) ambient.current = new Ambient();
  const progressRef = useRef(closing ? 1 : 0);
  const screenOnRef = useRef(!closing);
  const swayRef = useRef({ x: 0, y: 0 });
  const readyRef = useRef(false);
  const handedOffRef = useRef(closing);
  const cancelTweenRef = useRef(null);
  const liveRef = useRef(false);
  const navRef = useRef(0);
  const lastChapter = useRef(-2);

  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const bridgeRef = useRef(null);
  const macRef = useRef(null);
  const sceneRef = useRef(null);
  const glowRef = useRef(null);
  const wordRefs = useRef([]);
  const captionRef = useRef(null);
  const captionTextRef = useRef(null);
  const railRef = useRef(null);
  const layout = useRef({ story: 0, timeline: 0, proof: 0, bridge: 0, mac: 0 });

  const handleReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  // Lock scrolling while the loader is up.
  useEffect(() => {
    if (entered) return undefined;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      root.style.overflow = prev;
    };
  }, [entered]);

  useEffect(() => () => ambient.current?.dispose(), []);
  useEffect(() => preloadShutter(), []);

  const setSound = useCallback((on) => {
    const a = ambient.current;
    if (on) {
      a.start();
      primeShutter(a);
    } else a.stop();
    setSoundOn(on);
  }, []);
  const toggleSound = useCallback(() => setSound(!ambient.current.on), [setSound]);

  useEffect(() => {
    if (!entered || !active) return undefined;
    const onKey = (e) => {
      if (e.key?.toLowerCase() !== 'm' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return;
      toggleSound();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entered, active, toggleSound]);

  const enter = (withSound, exitMs) => {
    if (withSound) setSound(true);
    setEntered(true);
    setTimeout(() => setHeroGo(true), Math.max(0, exitMs - 250));
    setTimeout(() => setLoaderGone(true), exitMs);
  };

  const onShutter = useCallback(() => playShutter(ambient.current), []);
  const onHeroDone = useCallback(() => setNameIn(true), []);
  const Hero = HERO_VARIANT === 'b' ? HeroBooth : HeroScreenshot;

  // Section tops, measured once per layout change (never inside the frame loop).
  const measure = useCallback(() => {
    const top = (el) => (el ? el.offsetTop : 0);
    const root = rootRef.current;
    if (!root) return;
    const q = (id) => root.querySelector(`#${id}`);
    layout.current = {
      story: top(q('story')),
      timeline: top(q('timeline')),
      proof: top(q('proof')),
      bridge: top(bridgeRef.current),
      mac: use3D ? top(macRef.current) : top(bridgeRef.current) + (bridgeRef.current?.offsetHeight ?? 0),
    };
  }, [use3D]);

  useEffect(() => {
    measure();
    const root = rootRef.current;
    const ro = new ResizeObserver(measure);
    if (root) ro.observe(root);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Cursor leans the camera.
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduced) return undefined;
    const onMove = (e) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5;
      pointer.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  // Scroll → macProgress → the room, chapter words, score and hand-off.
  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const L = layout.current;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = maxScroll();

      // macProgress: 0 at the top of the Mac runway, 1 at the end of the page.
      const raw = use3D && max > L.mac ? clamp01((y - L.mac) / (max - L.mac)) : 0;
      const prev = progressRef.current;
      let p = prev + (raw - prev) * (1 - Math.exp(-dt * 5));
      if (Math.abs(raw - p) < 0.0004) p = raw;
      progressRef.current = p;

      const k = 1 - Math.exp(-dt * 3.2);
      swayRef.current.x += (pointer.current.x * 0.34 - swayRef.current.x) * k;
      swayRef.current.y += (pointer.current.y * -0.1 - swayRef.current.y) * k;

      // The 3D room only renders continuously once the Mac is near.
      const near = y > L.bridge - vh * 1.3;
      if (near !== liveRef.current) {
        liveRef.current = near;
        setLive(near);
      }

      // Hero is plain page content; hide it once it is well off-screen.
      if (heroRef.current) heroRef.current.style.visibility = y > vh * 1.2 ? 'hidden' : 'visible';

      // The room fades up behind the bridge line, fully there when the runway starts.
      const sceneT = use3D && readyRef.current ? ease(ramp(y, L.bridge + vh * 0.25, L.mac)) : 0;
      if (sceneRef.current) sceneRef.current.style.opacity = String(sceneT);

      const c = roomColor(p);
      if (glowRef.current) {
        glowRef.current.style.setProperty('--room', `${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)}`);
        glowRef.current.style.opacity = String((0.45 + 0.55 * sceneT) * (1 - ramp(p, 0.72, 0.84)));
      }

      CHAPTERS.forEach((ch, i) => {
        const el = wordRefs.current[i];
        if (!el) return;
        const inT = ease(ramp(p, ch.from - 0.03, ch.from + 0.05));
        const outT = ease(ramp(p, ch.to - 0.05, ch.to + 0.02));
        const vis = inT * (1 - outT);
        el.style.opacity = String(vis);
        el.style.transform = `translate3d(0, ${(1 - inT) * 12 - outT * 12}vh, 0) scale(${0.94 + vis * 0.06})`;
      });

      const { index } = chapterAt(p);
      const inChapters = p >= CHAPTERS[0].from - 0.02 && p < CHAPTERS[CHAPTERS.length - 1].to;
      if (captionRef.current) captionRef.current.style.opacity = inChapters ? '1' : '0';
      if (railRef.current) railRef.current.style.transform = `scaleX(${ramp(p, CHAPTERS[0].from, CHAPTERS[CHAPTERS.length - 1].to)})`;
      if (index !== lastChapter.current) {
        lastChapter.current = index;
        if (captionTextRef.current && index >= 0) {
          captionTextRef.current.dataset.n = `0${index + 1}`;
          captionTextRef.current.textContent = CHAPTERS[index].caption;
        }
        ambient.current.setChapter(index);
      }
      ambient.current.setDepth(p);

      // Which section is the visitor in? (nav dots)
      const mid = y + vh * 0.5;
      const idx = mid >= L.mac ? 4 : mid >= L.proof ? 3 : mid >= L.timeline ? 2 : mid >= L.story ? 1 : 0;
      const navIdx = mid >= L.bridge && mid < L.mac ? 4 : idx;
      if (navIdx !== navRef.current) {
        navRef.current = navIdx;
        setNavIndex(navIdx);
      }

      if (!screenOnRef.current && p < 0.2) screenOnRef.current = true;

      if (mode === 'open' && use3D && readyRef.current && !handedOffRef.current && p >= HANDOFF_AT && raw >= 0.95) {
        handedOffRef.current = true;
        ambient.current.stop();
        setSoundOn(false);
        onReachScreen?.();
      }
      if (p < 0.9) handedOffRef.current = false;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, mode, onReachScreen, use3D]);

  // Shut Down: start dived-in and glide all the way back to the hero.
  useEffect(() => {
    if (mode !== 'close') return undefined;
    handedOffRef.current = true;
    window.scrollTo(0, maxScroll());
    if (!use3D) {
      window.scrollTo(0, 0);
      onClosed?.();
      return undefined;
    }
    const t = setTimeout(() => {
      cancelTweenRef.current = tweenScroll(0, CLOSE_MS, onClosed);
    }, 350);
    return () => {
      clearTimeout(t);
      cancelTweenRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => () => cancelTweenRef.current?.(), []);

  const scrollToY = (y, ms = 1400) => {
    cancelTweenRef.current?.();
    cancelTweenRef.current = tweenScroll(y, ms);
  };
  const startScrolling = () => {
    ambient.current.tick(1.2);
    scrollToY(layout.current.story);
  };
  const goTo = (i) => {
    const L = layout.current;
    const y = [0, L.story, L.timeline, L.proof, L.bridge][i];
    scrollToY(y, 1200);
  };
  const tickSound = () => ambient.current.tick();

  const flat = !use3D;

  return (
    <section ref={rootRef} className={`${styles.intro} ${flat ? styles.flat : ''}`} aria-label="Introduction">
      {/* Fixed room: light, chapter words, the 3D Mac, grain. Page content scrolls over it. */}
      <div className={styles.fixed} aria-hidden>
        <div ref={glowRef} className={styles.glow} style={{ '--room': '122 140 255' }} />
        <div className={styles.words}>
          {CHAPTERS.map((ch, i) => (
            <span
              key={ch.id}
              ref={(el) => {
                wordRefs.current[i] = el;
              }}
              className={styles.word}
              style={{ color: ch.color }}
            >
              {ch.word}
            </span>
          ))}
        </div>
        {use3D && (
          <div ref={sceneRef} className={styles.scene}>
            <SceneBoundary onFail={() => setUse3D(false)}>
              <Suspense fallback={null}>
                <World
                  progressRef={progressRef}
                  screenOnRef={screenOnRef}
                  swayRef={reduced ? undefined : swayRef}
                  onReady={handleReady}
                  live={live}
                  active={active}
                />
              </Suspense>
            </SceneBoundary>
          </div>
        )}
        <div className={styles.grain} />
      </div>

      {entered && (
        <header className={styles.bar}>
          <motion.span className={styles.mark} aria-hidden {...rise(0.1, reduced)}>
            K.
          </motion.span>
          <motion.nav className={styles.barRight} aria-label="Quick links" {...rise(0.2, reduced)}>
            <SoundToggle on={soundOn} onToggle={toggleSound} />
            {SHOW_RESUME && (
              <a className={styles.barLink} href="/cv.pdf" target="_blank" rel="noreferrer" onPointerEnter={tickSound}>
                Resume
              </a>
            )}
            <button type="button" className={styles.barLink} onClick={onSkip} onPointerEnter={tickSound}>
              Skip to desktop
            </button>
            <button type="button" className={styles.barLink} onClick={() => setContactOpen(true)} onPointerEnter={tickSound}>
              Contact
            </button>
          </motion.nav>
        </header>
      )}

      {entered && (
        <nav className={styles.dots} aria-label="Sections">
          {NAV.map((n, i) => (
            <button
              key={n.id}
              type="button"
              className={`${styles.dot} ${i === navIndex ? styles.dotOn : ''}`}
              onClick={() => goTo(i)}
              aria-label={n.label}
              aria-current={i === navIndex ? 'true' : undefined}
            >
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      )}

      <div className={styles.flow}>
        <section
          id="hero"
          ref={heroRef}
          className={`${styles.hero} ${HERO_VARIANT === 'b' ? styles.heroBooth : ''}`}
          data-hero
          aria-label="Ken Nathanael"
        >
          <Hero
            go={heroGo}
            reduced={reduced}
            instant={closing}
            src={HERO_VIDEO.src}
            poster={HERO_VIDEO.poster}
            onShutter={onShutter}
            onDone={onHeroDone}
          />
          <div className={styles.copy}>
            {nameIn && (
              <>
                <motion.p className={styles.eyebrow} {...rise(0.1, reduced)}>
                  {POSITIONING.chip}
                </motion.p>
                <HeroName reduced={reduced} />
                <motion.p className={styles.oneLiner} {...rise(0.55, reduced)}>
                  {POSITIONING.line}
                </motion.p>
                <motion.div className={styles.actions} {...rise(0.7, reduced)}>
                  <MagneticButton className={heroStyles.cta} onClick={startScrolling} onPointerEnter={tickSound}>
                    Start scrolling
                    <span className={heroStyles.ctaIcon}>
                      <ArrowDown />
                    </span>
                  </MagneticButton>
                  <span className={styles.scrollHint}>Story, experience, then the Mac. About a minute.</span>
                </motion.div>
              </>
            )}
          </div>
        </section>

        <Story />
        <Timeline />
        <Proof reduced={reduced} />
        <Bridge ref={bridgeRef} flat={flat} onOpen={() => onReachScreen?.()} />
        {!flat && <div ref={macRef} className={styles.macRunway} aria-hidden />}
      </div>

      <div ref={captionRef} className={styles.caption} aria-hidden>
        <span className={styles.rail}>
          <span ref={railRef} className={styles.railFill} />
        </span>
        <p ref={captionTextRef} className={styles.captionText} data-n="01">
          {CHAPTERS[0].caption}
        </p>
      </div>

      {!loaderGone && <Loader onEnter={enter} reduced={reduced} expectAssets={use3D} />}
      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
