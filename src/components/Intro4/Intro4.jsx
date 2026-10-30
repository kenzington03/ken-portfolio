// Hero v4, "Exposure". A light studio page that turns its lights off once,
// right before the Mac:
//   Hero (shutter curtain, edge-to-edge name, the portrait is a camera)
//   → Story (lines develop like prints) → Experience (odometer + lens ruler)
//   → Trusted by (marquee + two quotes) → Lights out → the MacBook sequence
//   from v3 (orbit, Build/Move/Ship room colours, lid, dive) → welcome → macOS.
// No loader and no sound gate: the only sound is the shutter, on clicks.
// Same contract as <Intro>/<Intro2>/<Intro3> so App's flow is shared.

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import ContactCard from '../Intro/ContactCard.jsx';
import { SceneBoundary, hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../Intro/shared.jsx';
import { CHAPTERS, HANDOFF_AT, chapterAt, ease, ramp, roomColor } from '../Intro3/timeline.js';
import Hero from './Hero.jsx';
import Story from './Story.jsx';
import Timeline from './Timeline.jsx';
import Proof from './Proof.jsx';
import { disposeSfx, playShutter, preloadShutter } from './sfx.js';
import styles from './Intro4.module.css';

const World = lazy(() => import('../Intro3/World.jsx'));

const CLOSE_MS = 3600;
// Drop the real walk-in here once it exists (public/assets/hero/walkin/).
const HERO_VIDEO = { src: undefined, poster: undefined };

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, t) => Math.round(a + (b - a) * t);

export default function Intro4({ mode = 'open', active = true, onReachScreen, onSkip, onClosed }) {
  const closing = mode === 'close';
  const [reduced] = useState(prefersReducedMotion);
  const [use3D, setUse3D] = useState(() => hasWebGL2() && !prefersReducedMotion());
  const [contactOpen, setContactOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [dark, setDark] = useState(closing);

  const progressRef = useRef(closing ? 1 : 0);
  const screenOnRef = useRef(!closing);
  const swayRef = useRef({ x: 0, y: 0 });
  const readyRef = useRef(false);
  const handedOffRef = useRef(closing);
  const cancelTweenRef = useRef(null);
  const liveRef = useRef(false);
  const darkRef = useRef(closing);
  const lastChapter = useRef(-2);

  const rootRef = useRef(null);
  const bridgeRef = useRef(null);
  const bridgeLineRef = useRef(null);
  const macRef = useRef(null);
  const sceneRef = useRef(null);
  const glowRef = useRef(null);
  const wordRefs = useRef([]);
  const captionRef = useRef(null);
  const captionTextRef = useRef(null);
  const railRef = useRef(null);
  const layout = useRef({ story: 0, bridge: 0, mac: 0 });

  const handleReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  useEffect(() => {
    preloadShutter();
    return disposeSfx;
  }, []);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const top = (el) => (el ? el.offsetTop : 0);
    layout.current = {
      story: top(root.querySelector('#story')),
      bridge: top(bridgeRef.current),
      mac: use3D ? top(macRef.current) : top(bridgeRef.current) + (bridgeRef.current?.offsetHeight ?? 0),
    };
  }, [use3D]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

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

  // One frame loop: lights-out amount, macProgress, chapter words, hand-off.
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

      // Lights out: the bridge headline goes from ink-on-paper to paper-on-ink.
      const lights = ease(ramp(y, L.bridge - vh * 0.35, L.bridge + vh * 0.35));
      if (bridgeLineRef.current) {
        const c = mix(17, 236, lights);
        bridgeLineRef.current.style.color = `rgb(${c} ${c} ${mix(19, 234, lights)})`;
      }
      const isDark = lights > 0.5;
      if (isDark !== darkRef.current) {
        darkRef.current = isDark;
        setDark(isDark);
      }

      const raw = use3D && max > L.mac ? clamp01((y - L.mac) / (max - L.mac)) : 0;
      const prev = progressRef.current;
      let p = prev + (raw - prev) * (1 - Math.exp(-dt * 5));
      if (Math.abs(raw - p) < 0.0004) p = raw;
      progressRef.current = p;

      const k = 1 - Math.exp(-dt * 3.2);
      swayRef.current.x += (pointer.current.x * 0.34 - swayRef.current.x) * k;
      swayRef.current.y += (pointer.current.y * -0.1 - swayRef.current.y) * k;

      const near = y > L.bridge - vh * 1.3;
      if (near !== liveRef.current) {
        liveRef.current = near;
        setLive(near);
      }

      const sceneT = use3D && readyRef.current ? ease(ramp(y, L.bridge + vh * 0.2, L.mac)) : 0;
      if (sceneRef.current) sceneRef.current.style.opacity = String(sceneT);

      const c = roomColor(p);
      if (glowRef.current) {
        glowRef.current.style.setProperty('--room', `${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)}`);
        glowRef.current.style.opacity = String(sceneT * (1 - ramp(p, 0.72, 0.84)));
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
      }

      if (!screenOnRef.current && p < 0.2) screenOnRef.current = true;

      if (mode === 'open' && use3D && readyRef.current && !handedOffRef.current && p >= HANDOFF_AT && raw >= 0.95) {
        handedOffRef.current = true;
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
  const toStory = () => scrollToY(layout.current.story);
  const openMac = () => {
    playShutter({ level: 0.5 });
    if (!use3D) {
      onReachScreen?.();
      return;
    }
    scrollToY(layout.current.mac, 1800);
  };

  const flat = !use3D;

  return (
    <section
      ref={rootRef}
      className={`${styles.intro} ${flat ? styles.flat : ''}`}
      data-dark={dark ? 'true' : undefined}
      aria-label="Introduction"
    >
      {/* Fixed dark room behind the page; only the last stretch is transparent. */}
      <div className={styles.room} aria-hidden>
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
      </div>

      <header className={styles.nav}>
        <span className={styles.navName}>Ken Nathanael</span>
        <nav className={styles.navLinks} aria-label="Quick links">
          <button type="button" className={styles.navLink} onClick={() => setContactOpen(true)}>
            Contact
          </button>
          <button type="button" className={styles.navLink} onClick={onSkip}>
            Skip to desktop
          </button>
        </nav>
      </header>

      <div className={styles.page}>
        <Hero
          reduced={reduced}
          instant={closing}
          onOpenMac={openMac}
          onStory={toStory}
          video={HERO_VIDEO.src}
          poster={HERO_VIDEO.poster}
        />
        <Story />
        <Timeline />
        <Proof reduced={reduced} />

        <section id="bridge" ref={bridgeRef} className={styles.bridge} aria-label="Open the Mac">
          <div className={styles.bridgeInner}>
            <p ref={bridgeLineRef} className={styles.bridgeLine}>
              The work lives on my Mac.
            </p>
            {flat ? (
              <button type="button" className={styles.btnLight} onClick={() => onReachScreen?.()}>
                Open my Mac
              </button>
            ) : (
              <p className={styles.bridgeSub}>Keep going. It opens.</p>
            )}
          </div>
        </section>
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

      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
