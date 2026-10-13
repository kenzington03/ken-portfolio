// Journey A, "Through the letters". The greeting is the window: "Hey, I'm
// Ken." is set huge and Ken's real work drifts inside the letterforms, so
// the first thing you read is also the first proof of taste. Name, role,
// city, years and real logos sit right under it, readable at once. A career
// strip ticks along the bottom edge (company and year only).
//
// Then one pinned beat: three short lines, one on screen at a time (never
// stacked), with every kudos note drifting faintly behind them. The lights go
// out and the Space Grey Mac takes over.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import ContactCard from '../../Intro/ContactCard.jsx';
import { hasWebGL2, maxScroll, prefersReducedMotion, tweenScroll } from '../../Intro/shared.jsx';
import { ease, ramp } from '../../Intro3/timeline.js';
import { playShutter, preloadShutter } from '../../Intro4/sfx.js';
import MacRoom from '../MacRoom.jsx';
import { CAREER, KUDOS, LOGOS, ME, STORY, WORK } from '../content.js';
import styles from './JourneyA.module.css';

const EASE = [0.16, 1, 0.3, 1];
const VB_W = 1600;
const VB_H = 470;

/** The work, two rows drifting in opposite directions, nudged by the pointer. */
function Collage({ reduced }) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const x = useTransform(sx, (v) => v * -40);
  const y = useTransform(sy, (v) => v * -24);
  useEffect(() => {
    if (reduced) return undefined;
    const on = (e) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, [px, py, reduced]);
  const rowA = [...WORK.slice(0, 4), ...WORK.slice(0, 4)];
  const rowB = [...WORK.slice(4), ...WORK.slice(4)];
  return (
    <motion.div className={styles.collage} style={{ x, y }}>
      <div className={`${styles.row} ${styles.rowA}`}>
        {rowA.map((w, i) => (
          <img key={`${w.title}-${i}`} src={w.src} alt="" draggable={false} />
        ))}
      </div>
      <div className={`${styles.row} ${styles.rowB}`}>
        {rowB.map((w, i) => (
          <img key={`${w.title}-${i}`} src={w.src} alt="" draggable={false} />
        ))}
      </div>
    </motion.div>
  );
}

function Window({ reduced }) {
  return (
    <div className={styles.window}>
      <svg className={styles.clipSvg} viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden>
        <defs>
          <clipPath id="ken-hello" clipPathUnits="objectBoundingBox" transform={`scale(${1 / VB_W} ${1 / VB_H})`}>
            <text x="0" y={VB_H * 0.86} textLength={VB_W} lengthAdjust="spacingAndGlyphs" className={styles.clipText}>
              {ME.hello}
            </text>
          </clipPath>
        </defs>
      </svg>
      <div className={styles.clipped} style={{ clipPath: 'url(#ken-hello)' }}>
        <Collage reduced={reduced} />
      </div>
      <svg className={styles.outline} viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden>
        <text x="0" y={VB_H * 0.86} textLength={VB_W} lengthAdjust="spacingAndGlyphs" className={styles.outlineText}>
          {ME.hello}
        </text>
      </svg>
    </div>
  );
}

function Ticker() {
  const items = [...CAREER, ...CAREER];
  return (
    <div className={styles.ticker} aria-label={`Career: ${CAREER.map((c) => `${c.company} ${c.when}`).join(', ')}`} role="img">
      <div className={styles.tickerTrack} aria-hidden>
        {items.map((c, i) => (
          <span key={`${c.company}-${i}`}>
            <b>{c.company}</b> {c.when}
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero({ reduced, onOpenMac }) {
  const rise = (d) =>
    reduced
      ? {}
      : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: EASE, delay: d } };
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hello">
      <h1 id="hello" className={styles.srOnly}>
        {ME.hello} {ME.name}, {ME.role}.
      </h1>
      <motion.div
        className={styles.windowWrap}
        initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1], delay: 0.15 }}
      >
        <Window reduced={reduced} />
      </motion.div>

      <div className={styles.under}>
        <div className={styles.who}>
          <motion.p className={styles.name} {...rise(0.7)}>
            {ME.name}
          </motion.p>
          <motion.p className={styles.meta} {...rise(0.8)}>
            {ME.role}, {ME.city}. {ME.years}. {ME.line}
          </motion.p>
          <motion.div className={styles.ctaRow} {...rise(0.9)}>
            <button type="button" className={styles.btn} onClick={onOpenMac}>
              Open my Mac
            </button>
            <span className={styles.ctaNote}>Projects, resume and contact inside.</span>
          </motion.div>
        </div>
        <motion.ul className={styles.logos} aria-label="Brands Ken has worked with" {...rise(1)}>
          {LOGOS.map((l) => (
            <li key={l.name}>
              <img src={l.src} alt={l.name} style={{ width: l.w }} />
            </li>
          ))}
        </motion.ul>
      </div>
      <Ticker />
    </section>
  );
}

/** One pinned beat. Exactly one line is mounted at a time, so nothing ghosts. */
function Story({ reduced }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [i, setI] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const n = Math.min(STORY.length - 1, Math.floor(v * STORY.length * 1.0001));
    setI((c) => (c === n ? c : n));
  });
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const kudos = [...KUDOS, ...KUDOS];
  return (
    <section id="story" ref={ref} className={styles.story} aria-label="About Ken">
      <div className={styles.storySticky}>
        <div className={styles.kudosBg} aria-hidden>
          <div className={styles.kudosTrack}>
            {kudos.map((k, n) => (
              <p key={n}>
                “{k.quote}” <span>{k.name}</span>
              </p>
            ))}
          </div>
        </div>
        <ol className={styles.srOnly}>
          {STORY.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
        <div className={styles.storyStage} aria-hidden>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={i}
              className={styles.storyLine}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -30, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {STORY[i]}
            </motion.p>
          </AnimatePresence>
          <div className={styles.storyDots}>
            {STORY.map((l, n) => (
              <span key={l} className={n === i ? styles.dotOn : ''} />
            ))}
          </div>
        </div>
        <span className={styles.storyBar}>
          <motion.span style={{ scaleX: bar }} />
        </span>
      </div>
    </section>
  );
}

export default function JourneyA({ mode = 'open', active = true, onReachScreen, onSkip, onClosed }) {
  const [reduced] = useState(prefersReducedMotion);
  const [use3D, setUse3D] = useState(() => hasWebGL2() && !prefersReducedMotion());
  const [contactOpen, setContactOpen] = useState(false);
  const [dark, setDark] = useState(mode === 'close');
  const darkRef = useRef(mode === 'close');
  const runwayRef = useRef(null);
  const bridgeRef = useRef(null);
  const bridgeLineRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    preloadShutter();
    return () => cancelRef.current?.();
  }, []);

  const openMac = useCallback(() => {
    playShutter({ level: 0.5 });
    if (!use3D) {
      onReachScreen?.();
      return;
    }
    cancelRef.current?.();
    const top = runwayRef.current?.offsetTop ?? maxScroll();
    cancelRef.current = tweenScroll(top, 1800);
  }, [use3D, onReachScreen]);

  const sceneFadeFrom = useCallback(() => (bridgeRef.current?.offsetTop ?? 0) + window.innerHeight * 0.2, []);

  const onFrame = useCallback((y) => {
    const b = bridgeRef.current;
    if (!b) return;
    const vh = window.innerHeight;
    const t = ease(ramp(y, b.offsetTop - vh * 0.35, b.offsetTop + vh * 0.35));
    if (bridgeLineRef.current) {
      const c = Math.round(18 + (236 - 18) * t);
      bridgeLineRef.current.style.color = `rgb(${c} ${c} ${c})`;
    }
    const d = t > 0.5;
    if (d !== darkRef.current) {
      darkRef.current = d;
      setDark(d);
    }
  }, []);

  const flat = !use3D;

  return (
    <section className={styles.journey} data-dark={dark ? 'true' : undefined} aria-label="Introduction">
      <MacRoom
        runwayRef={runwayRef}
        use3D={use3D}
        setUse3D={setUse3D}
        reduced={reduced}
        active={active}
        mode={mode}
        onReachScreen={onReachScreen}
        onClosed={onClosed}
        sceneFadeFrom={sceneFadeFrom}
        onFrame={onFrame}
      />

      <header className={styles.bar}>
        <span className={styles.barName}>Ken Nathanael</span>
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
        <Hero reduced={reduced} onOpenMac={openMac} />
        <Story reduced={reduced} />
        <section ref={bridgeRef} className={styles.bridge} aria-label="Open the Mac">
          <div className={styles.bridgeInner}>
            <p ref={bridgeLineRef} className={styles.bridgeLine}>
              Lights off. Mac on.
            </p>
            {flat && (
              <button type="button" className={styles.btnLight} onClick={() => onReachScreen?.()}>
                Open my Mac
              </button>
            )}
          </div>
        </section>
        {!flat && <div ref={runwayRef} className={styles.runway} aria-hidden />}
      </div>

      <ContactCard open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}
