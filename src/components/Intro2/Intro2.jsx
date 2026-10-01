// Hero v2, "Night Studio": loader → 3D room with the MacBook and Ken's work
// floating in the fog → three scroll chapters that recolour the room →
// lid opens, camera dives into the screen → the existing welcome + macOS.
// Same contract as v1's <Intro> so App's flow (welcome, Shut Down) is shared.

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ContactCard from '../Intro/ContactCard.jsx';
import HeroName from '../Intro/hero/HeroName.jsx';
import RollingWords from '../Intro/hero/RollingWords.jsx';
import MagneticButton from '../Intro/hero/MagneticButton.jsx';
import heroStyles from '../Intro/hero/hero.module.css';
import {
  ArrowDown,
  ArrowRight,
  SceneBoundary,
  hasWebGL2,
  maxScroll,
  prefersReducedMotion,
  tweenScroll,
} from '../Intro/shared.jsx';
import Loader from './Loader.jsx';
import SoundToggle from './SoundToggle.jsx';
import { Ambient } from './ambient.js';
import { CHAPTERS, HANDOFF_AT, chapterAt, ease, ramp, roomColor } from './timeline.js';
import styles from './Intro2.module.css';

const World = lazy(() => import('./World.jsx'));

const OPEN_MS = 5200;
const CLOSE_MS = 2600;
const ROLES = ['brands', 'strategy', 'campaigns', 'interfaces', 'motion', 'experiences'];

const rise = (delay, reduced) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay },
      };

export default function Intro2({ mode = 'open', active = true, onReachScreen, onSkip, onClosed }) {
  const [use3D, setUse3D] = useState(hasWebGL2);
  const [reduced] = useState(prefersReducedMotion);
  // Returning from Shut Down skips the loader: the visitor already chose.
  const [entered, setEntered] = useState(mode === 'close');
  const [heroIn, setHeroIn] = useState(mode === 'close');
  const [loaderGone, setLoaderGone] = useState(mode === 'close');
  const [soundOn, setSoundOn] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const ambient = useRef(null);
  if (!ambient.current) ambient.current = new Ambient();
  const progressRef = useRef(mode === 'close' ? 1 : 0);
  const screenOnRef = useRef(mode !== 'close');
  const swayRef = useRef({ x: 0, y: 0 });
  const readyRef = useRef(false);
  // Returning from Shut Down counts as already handed off: an interrupted
  // glide must not bounce straight back into the welcome screen.
  const handedOffRef = useRef(mode === 'close');
  const cancelTweenRef = useRef(null);

  const heroRef = useRef(null);
  const sceneRef = useRef(null);
  const glowRef = useRef(null);
  const wordRefs = useRef([]);
  const captionRef = useRef(null);
  const captionTextRef = useRef(null);
  const railRef = useRef(null);
  const lastChapter = useRef(-2);

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

  const setSound = useCallback((on) => {
    const a = ambient.current;
    if (on) a.start();
    else a.stop();
    setSoundOn(on);
  }, []);

  const toggleSound = useCallback(() => setSound(!ambient.current.on), [setSound]);

  // "M" toggles sound while the intro is on screen, unless the visitor is typing.
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
    setTimeout(() => setHeroIn(true), Math.max(0, exitMs - 380));
    setTimeout(() => setLoaderGone(true), exitMs);
  };

  // Cursor leans the camera (spring-smoothed in the loop below).
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

  // Scroll → smoothed progress → every DOM beat, the sway and the score.
  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    let last = performance.now();
    const tint = { r: 0, g: 0, b: 0 };
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const max = maxScroll();
      const raw = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const prev = progressRef.current;
      let p = prev + (raw - prev) * (1 - Math.exp(-dt * 5));
      if (Math.abs(raw - p) < 0.0004) p = raw;
      progressRef.current = p;

      const k = 1 - Math.exp(-dt * 3.2);
      swayRef.current.x += (pointer.current.x * 0.34 - swayRef.current.x) * k;
      swayRef.current.y += (pointer.current.y * -0.1 - swayRef.current.y) * k;

      // Hero copy scrolls away like page content.
      const lift = Math.min(p * max, window.innerHeight);
      if (heroRef.current) {
        heroRef.current.style.transform = `translate3d(0, ${-lift}px, 0)`;
        heroRef.current.style.visibility = lift >= window.innerHeight ? 'hidden' : 'visible';
      }
      if (sceneRef.current) sceneRef.current.style.opacity = readyRef.current ? '1' : '0';

      // Room glow follows the chapter colour.
      const c = roomColor(p);
      tint.r = Math.round(c.r * 255);
      tint.g = Math.round(c.g * 255);
      tint.b = Math.round(c.b * 255);
      if (glowRef.current) {
        glowRef.current.style.setProperty('--room', `${tint.r} ${tint.g} ${tint.b}`);
        glowRef.current.style.opacity = String(1 - ramp(p, 0.72, 0.84));
      }

      // Chapter words: rise in from below, hold, drift up and out.
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

      if (!screenOnRef.current && p < 0.2) screenOnRef.current = true;

      if (mode === 'open' && readyRef.current && !handedOffRef.current && p >= HANDOFF_AT && raw >= 0.95) {
        handedOffRef.current = true;
        ambient.current.stop();
        setSoundOn(false);
        onReachScreen?.();
      }
      if (p < 0.9) handedOffRef.current = false;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, mode, onReachScreen]);

  // Shut Down: start dived-in and glide back to the hero.
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

  const openMac = () => {
    ambient.current.tick(1.2);
    if (!use3D) {
      onReachScreen?.();
      return;
    }
    cancelTweenRef.current?.();
    cancelTweenRef.current = tweenScroll(maxScroll(), OPEN_MS);
  };

  const tick = () => ambient.current.tick();

  return (
    <section className={`${styles.intro} ${use3D ? '' : styles.flat}`} aria-label="Introduction">
      <div className={styles.stage}>
        <div ref={glowRef} className={styles.glow} style={{ '--room': '122 140 255' }} aria-hidden />

        <div className={styles.words} aria-hidden>
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
          <div ref={sceneRef} className={styles.scene} aria-hidden>
            <SceneBoundary onFail={() => setUse3D(false)}>
              <Suspense fallback={null}>
                <World
                  progressRef={progressRef}
                  screenOnRef={screenOnRef}
                  swayRef={reduced ? undefined : swayRef}
                  reduced={reduced}
                  onReady={handleReady}
                  active={active}
                />
              </Suspense>
            </SceneBoundary>
          </div>
        )}

        <div className={styles.grain} aria-hidden />

        {entered && (
          <header className={styles.bar}>
            <motion.span className={styles.mark} aria-hidden {...rise(0.1, reduced)}>
              K.
            </motion.span>
            <motion.nav className={styles.barRight} aria-label="Quick links" {...rise(0.2, reduced)}>
              <SoundToggle on={soundOn} onToggle={toggleSound} />
              <a className={styles.barLink} href="/cv.pdf" target="_blank" rel="noreferrer" onPointerEnter={tick}>
                Resume
              </a>
              <button type="button" className={styles.barLink} onClick={() => setContactOpen(true)} onPointerEnter={tick}>
                Contact
              </button>
            </motion.nav>
          </header>
        )}

        <div ref={heroRef} className={styles.hero} data-hero>
          {heroIn && (
            <div className={styles.copy}>
              <motion.p className={styles.eyebrow} {...rise(0, reduced)}>
                Design Lead at Milestone Technologies
              </motion.p>
              <HeroName reduced={reduced} />
              <motion.p className={styles.oneLiner} {...rise(0.55, reduced)}>
                I design <RollingWords words={ROLES} reduced={reduced} />
              </motion.p>
              <motion.div className={styles.actions} {...rise(0.65, reduced)}>
                <MagneticButton className={heroStyles.cta} onClick={openMac} onPointerEnter={tick}>
                  Open my Mac
                  <span className={heroStyles.ctaIcon}>
                    <ArrowDown />
                  </span>
                </MagneticButton>
                <button type="button" className={heroStyles.ghost} onClick={onSkip} onPointerEnter={tick}>
                  Go to desktop
                  <span className={heroStyles.ghostIcon}>
                    <ArrowRight />
                  </span>
                </button>
              </motion.div>
            </div>
          )}
        </div>

        <div ref={captionRef} className={styles.caption}>
          <span className={styles.rail}>
            <span ref={railRef} className={styles.railFill} />
          </span>
          <p ref={captionTextRef} className={styles.captionText} data-n="01" aria-live="polite">
            {CHAPTERS[0].caption}
          </p>
        </div>
      </div>

      {!loaderGone && <Loader onEnter={enter} reduced={reduced} expectAssets={use3D} />}
      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
