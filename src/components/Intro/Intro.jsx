import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { HANDOFF_AT, ramp } from './introTimeline.js';
import { motion } from 'framer-motion';
import ContactCard from './ContactCard.jsx';
import HeroName from './hero/HeroName.jsx';
import RollingWords from './hero/RollingWords.jsx';
import MagneticButton from './hero/MagneticButton.jsx';
import LiquidCrystal from './hero/LiquidCrystal.jsx';
import heroStyles from './hero/hero.module.css';
import styles from './Intro.module.css';
import {
  ArrowDown,
  ArrowRight,
  SceneBoundary,
  hasWebGL2,
  maxScroll,
  prefersReducedMotion,
  tweenScroll,
} from './shared.jsx';

/* three.js + the model live in their own chunk, fetched while the visitor
   reads the hero — the hero is the loading screen nobody notices. */
const loadScene = () => import('./MacScene.jsx');
const MacScene = lazy(loadScene);

const OPEN_MS = 3400;
const ROLES = ['brands', 'strategy', 'campaigns', 'interfaces', 'motion', 'experiences'];

/** Wallpaper drifts up at this fraction of scroll: parallax behind the hero. */
const WALL_DRIFT = 0.3;

/** Entrances: ease-out, short, staggered after the name (skipped under reduced motion). */
const rise = (delay, reduced) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay },
      };
const fade = (delay, reduced) =>
  reduced
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, ease: 'easeOut', delay } };

const CLOSE_MS = 2600;

const canRender3D = () => !prefersReducedMotion() && hasWebGL2();

/**
 * Landing hero → scroll opens a real 3D MacBook → camera dives until the
 * welcome screen fills the viewport → `onReachScreen` hands over to the DOM
 * welcome screen. `mode="close"` plays it backwards (after Shut Down): starts
 * dived-in on a dark screen and glides back up to the hero.
 */
export default function Intro({ mode = 'open', active = true, onReachScreen, onSkip, onClosed }) {
  const [use3D, setUse3D] = useState(canRender3D);
  const [contactOpen, setContactOpen] = useState(false);
  const [reduced] = useState(prefersReducedMotion);
  const progressRef = useRef(mode === 'close' ? 1 : 0);
  const screenOnRef = useRef(mode !== 'close');
  const heroRef = useRef(null);
  const sceneRef = useRef(null);
  const bgRef = useRef(null);
  const wallRef = useRef(null);
  const wallRunningRef = useRef(true);
  // Returning from Shut Down counts as already handed off: an interrupted
  // glide must not bounce straight back into the welcome screen.
  const handedOffRef = useRef(mode === 'close');
  const readyRef = useRef(false);
  const cancelTweenRef = useRef(null);

  // Prefetch three.js + the model only when the 3D path will actually run.
  useEffect(() => {
    if (use3D) loadScene();
  }, [use3D]);

  // 3D dropped out (scene error): undo the inline styles the scroll loop left
  // behind, so the static hero isn't stuck lifted, hidden or dimmed.
  useEffect(() => {
    if (use3D) return;
    if (heroRef.current) {
      heroRef.current.style.transform = '';
      heroRef.current.style.visibility = '';
    }
    if (bgRef.current) bgRef.current.style.opacity = '';
    if (wallRef.current) wallRef.current.style.transform = '';
    wallRunningRef.current = true;
  }, [use3D]);

  const handleReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  // Scroll → smoothed progress, and the DOM beats that ride on it.
  useEffect(() => {
    if (!use3D || !active) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const max = maxScroll();
      const raw = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const prev = progressRef.current;
      let p = prev + (raw - prev) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(raw - p) < 0.0004) p = raw;
      progressRef.current = p;

      // The hero scrolls away like ordinary page content (no fade): it
      // tracks the smoothed scroll 1:1 until it has left the viewport.
      const lift = Math.min(p * max, window.innerHeight);
      if (heroRef.current) {
        heroRef.current.style.transform = `translate3d(0, ${-lift}px, 0)`;
        heroRef.current.style.visibility = lift >= window.innerHeight ? 'hidden' : 'visible';
      }
      if (sceneRef.current) sceneRef.current.style.opacity = readyRef.current ? '1' : '0';

      // Liquid-crystal wallpaper: drifts slower than the hero (parallax), dims
      // as the laptop takes over, and stops drawing once it is out.
      if (!reduced && wallRef.current) {
        wallRef.current.style.transform = `translate3d(0, ${-lift * WALL_DRIFT}px, 0)`;
      }
      const dim = ramp(p, 0.2, 0.5);
      if (bgRef.current) bgRef.current.style.opacity = String(1 - dim);
      wallRunningRef.current = dim < 1;

      // Not gated on mode: an interrupted Shut Down glide flips mode to
      // 'open' early, and the screen must still wake on the way back up.
      if (!screenOnRef.current && p < 0.2) screenOnRef.current = true;

      if (mode === 'open' && readyRef.current && !handedOffRef.current && p >= HANDOFF_AT && raw >= 0.95) {
        handedOffRef.current = true;
        onReachScreen?.();
      }
      if (p < 0.9) handedOffRef.current = false;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [use3D, active, mode, onReachScreen, reduced]);

  // Shut Down: start at the bottom (dark, dived-in) and glide back to the hero.
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
    if (!use3D) {
      onReachScreen?.();
      return;
    }
    cancelTweenRef.current?.();
    cancelTweenRef.current = tweenScroll(maxScroll(), OPEN_MS);
  };

  return (
    <section className={`${styles.intro} ${use3D ? '' : styles.static}`} aria-label="Introduction">
      <div className={styles.sticky}>
        <div ref={bgRef} className={heroStyles.bg} aria-hidden>
          <div ref={wallRef} className={heroStyles.wall}>
            <LiquidCrystal runningRef={wallRunningRef} />
          </div>
        </div>

        {use3D && (
          <div ref={sceneRef} className={styles.scene} aria-hidden>
            <SceneBoundary onFail={() => setUse3D(false)}>
              <Suspense fallback={null}>
                <MacScene
                  progressRef={progressRef}
                  screenOnRef={screenOnRef}
                  onReady={handleReady}
                  active={active}
                />
              </Suspense>
            </SceneBoundary>
          </div>
        )}

        <div ref={heroRef} className={heroStyles.layout} data-hero>
          <motion.nav className={heroStyles.island} aria-label="Quick links" {...fade(0.9, reduced)}>
            <span className={heroStyles.mark} aria-hidden>
              K.
            </span>
            <a className={heroStyles.islandLink} href="/cv.pdf" target="_blank" rel="noreferrer">
              Resume
            </a>
            <button type="button" className={heroStyles.islandLink} onClick={() => setContactOpen(true)}>
              Contact
            </button>
          </motion.nav>

          <div className={heroStyles.copy}>
            <motion.p className={heroStyles.eyebrow} {...rise(0.05, reduced)}>
              Design Lead, Milestone Technologies
            </motion.p>
            <HeroName reduced={reduced} />
            <motion.p className={heroStyles.oneLiner} {...rise(0.62, reduced)}>
              I design <RollingWords words={ROLES} reduced={reduced} />
            </motion.p>
            <motion.div className={heroStyles.actions} {...rise(0.72, reduced)}>
              <MagneticButton className={heroStyles.cta} onClick={openMac}>
                Open my Mac
                <span className={heroStyles.ctaIcon}>
                  <ArrowDown />
                </span>
              </MagneticButton>
              <button type="button" className={heroStyles.ghost} onClick={onSkip}>
                See the work
                <span className={heroStyles.ghostIcon}>
                  <ArrowRight />
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
