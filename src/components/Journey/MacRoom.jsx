// The constant of every journey: a fixed dark room behind the page with the
// Space Grey MacBook. Scroll over the runway (the element passed as
// `runwayRef`) drives macProgress: orbit with the three lines (one sentence:
// I build brands, launch them with campaigns, and make them move; each with
// what it buys right under it), lid, wake, dive, then hand-off to the
// welcome screen. Also owns the Shut Down replay (mode 'close').

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { SceneBoundary, maxScroll, tweenScroll } from '../Intro/shared.jsx';
import { CHAPTERS, CHAPTER_STOPS, HANDOFF_AT, chapterAt, ease, ramp, roomColor } from '../Intro3/timeline.js';
import styles from './MacRoom.module.css';

const World = lazy(() => import('./World.jsx'));
const CLOSE_MS = 1300;
// Shut Down closes the lid and comes to rest on the Ship chapter (word and
// caption fully in, lid shut, before the lid beat begins).
const CLOSED_AT = CHAPTER_STOPS[2];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** A chapter's line, letter by letter: `t` 0..1 brings them up (each tips up
 *  out of its own slot, one after another), `out` 0..1 lifts them away over
 *  the top in the same order. Both follow the scroll, so it plays back. */
function setLetters(chapterEl, t, out) {
  const letters = chapterEl.__letters || (chapterEl.__letters = chapterEl.querySelectorAll('[data-letter]'));
  const SPREAD = 7;
  const n = letters.length;
  // Written only when they change: the room ticks every frame.
  const key = `${t.toFixed(4)}|${out.toFixed(4)}`;
  if (chapterEl.__lettersAt === key) return;
  chapterEl.__lettersAt = key;
  letters.forEach((el, i) => {
    el.style.setProperty('--t', clamp01((t * (n + SPREAD) - i) / SPREAD).toFixed(3));
    el.style.setProperty('--o', clamp01((out * (n + SPREAD) - i) / SPREAD).toFixed(3));
  });
}

/** Reveals a chapter's caption word by word (t 0..1): each word rises out of
 *  a blur in the chapter's colour and settles to white. */
function setCaption(chapterEl, t) {
  const words = chapterEl.__captionWords || (chapterEl.__captionWords = chapterEl.querySelectorAll('[data-caption-word]'));
  // Each word takes `SPREAD` words' worth of time to arrive, so they overlap.
  const SPREAD = 3;
  const n = words.length;
  words.forEach((w, i) => {
    w.style.setProperty('--t', clamp01((t * (n + SPREAD) - i) / SPREAD).toFixed(3));
  });
}
// The words' window runs from under the top bar to just above the laptop;
// the line + caption sit centred in it (even space above and below).
const WORD_GAP = 18;

export default function MacRoom({
  runwayRef,
  use3D,
  setUse3D,
  reduced,
  active = true,
  mode = 'open',
  onReachScreen,
  onClosed,
  poses,
  sway = true,
  sceneFadeFrom, // () => y where the 3D starts fading in (default: runway top - 1 vh)
  sceneFadeTo, // () => y where it is fully in (default: runway top)
  liveFrom, // () => y from where the 3D renders every frame (default: 1.6 vh above the runway)
  arrive = 'rise', // 'rise' lifts the laptop in; 'fade' holds it still (when something hands off to it)
  wordsOnTop = false, // overhead flows: the Mac fills the middle, so words sit above it
  alwaysLive = false, // the Mac is on screen from the first frame (The Desk)
  onFrame, // (y, p) per frame, for journey-specific effects
  logoRef, // optional: written with the lid logo's screen position ({ x, y, lidW } in px)
  beats, // optional: the runway's own beats (orbit, lid, wake, dive) for the 3D rig
  words = true, // false: no chapter words (the journey says its own)
  className = '',
  children, // extra fixed layers drawn behind the canvas (e.g. a cutting mat)
}) {
  const closing = mode === 'close';
  const [live, setLive] = useState(alwaysLive);
  const progressRef = useRef(closing ? 1 : 0);
  const screenOnRef = useRef(!closing);
  const swayRef = useRef({ x: 0, y: 0 });
  const readyRef = useRef(false);
  const handedOffRef = useRef(closing);
  const liveRef = useRef(alwaysLive);
  const cancelRef = useRef(null);
  const lastChapter = useRef(-2);
  // Chapter words can be held back (none of the current journeys do).
  const quietRef = useRef(false);
  const sceneRef = useRef(null);
  const glowRef = useRef(null);
  const wordRefs = useRef([]);
  const wordsRef = useRef(null);
  const anchorRef = useRef(0); // laptop's top edge on screen, px (written by the 3D scene)
  const railRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  const handleReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  useEffect(() => {
    if (reduced || !sway) return undefined;
    const onMove = (e) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5;
      pointer.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced, sway]);

  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = maxScroll();
      const runTop = runwayRef.current ? runwayRef.current.offsetTop : max;

      const raw = use3D && max > runTop ? clamp01((y - runTop) / (max - runTop)) : 0;
      const prev = progressRef.current;
      let p = prev + (raw - prev) * (1 - Math.exp(-dt * 5));
      if (Math.abs(raw - p) < 0.0004) p = raw;
      progressRef.current = p;

      const k = 1 - Math.exp(-dt * 3.2);
      swayRef.current.x += (pointer.current.x * 0.34 - swayRef.current.x) * k;
      swayRef.current.y += (pointer.current.y * -0.1 - swayRef.current.y) * k;

      const near = alwaysLive || y > (liveFrom ? liveFrom() : runTop - vh * 1.6);
      if (near !== liveRef.current) {
        liveRef.current = near;
        setLive(near);
      }

      const fadeFrom = sceneFadeFrom ? sceneFadeFrom() : runTop - vh;
      const fadeTo = sceneFadeTo ? sceneFadeTo() : runTop;
      const sceneT = use3D && readyRef.current ? (alwaysLive ? 1 : ease(ramp(y, fadeFrom, fadeTo))) : 0;
      if (sceneRef.current) {
        sceneRef.current.style.opacity = String(sceneT);
        // The laptop arrives by rising into place (no scaling: scaling a live
        // canvas smears it and fights the camera move).
        sceneRef.current.style.transform = alwaysLive || arrive === 'fade' || sceneT >= 1 ? '' : `translate3d(0, ${((1 - sceneT) * 7).toFixed(3)}vh, 0)`;
      }

      // Overhead flows: the words live in a window that ends just above the
      // laptop, so they rise out from behind its edge with an even gap.
      let winH = 0;
      if (wordsOnTop && wordsRef.current && anchorRef.current > 0) {
        winH = Math.max(200, anchorRef.current - WORD_GAP);
        wordsRef.current.style.height = `${winH}px`;
      }

      const c = roomColor(p);
      // (No chapters, no chapter glow: the laptop stands in its own light.)
      if (glowRef.current && !words) glowRef.current.style.opacity = '0';
      else if (glowRef.current) {
        glowRef.current.style.setProperty('--room', `${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)}`);
        glowRef.current.style.opacity = String(ramp(p, 0.0, 0.08) * (1 - ramp(p, 0.75, 0.87)));
      }

      CHAPTERS.forEach((ch, i) => {
        const el = wordRefs.current[i];
        if (!el) return;
        const inT = ease(ramp(p, ch.from - 0.03, ch.from + 0.05));
        const outT = ease(ramp(p, ch.to - 0.05, ch.to + 0.02));
        const vis = quietRef.current ? 0 : inT * (1 - outT);
        if (wordsOnTop) {
          // The line comes in letter by letter, its caption a beat behind,
          // and leaves the same way (the caption first) for the next line.
          // One line at a time: each is gone before the next comes in.
          const letIn = ramp(p, ch.from, ch.from + 0.08);
          // (Both stay whole past the chapter's stop: see CHAPTER_STOPS.)
          const letOut = ramp(p, ch.to - 0.045, ch.to - 0.005);
          el.style.opacity = quietRef.current || letIn <= 0 || letOut >= 1 ? '0' : '1';
          setLetters(el, letIn, letOut);
          setCaption(el, ramp(p, ch.from + 0.03, ch.from + 0.09) * (1 - ramp(p, ch.to - 0.055, ch.to - 0.03)));
        } else {
          el.style.opacity = String(vis);
          el.style.transform = `translate3d(0, ${(1 - inT) * 8 - outT * 8}vh, 0)`;
          setLetters(el, 1, 0);
          setCaption(el, ramp(p, ch.from + 0.075, ch.from + 0.135));
        }
      });
      if (railRef.current) railRef.current.style.transform = `scaleX(${ramp(p, CHAPTERS[0].from, CHAPTERS[CHAPTERS.length - 1].to)})`;
      const { index } = chapterAt(p);
      if (index !== lastChapter.current) lastChapter.current = index;

      if (!screenOnRef.current && p < 0.2) screenOnRef.current = true;
      onFrame?.(y, p);

      if (mode === 'open' && use3D && readyRef.current && !handedOffRef.current && p >= HANDOFF_AT && raw >= 0.95) {
        handedOffRef.current = true;
        onReachScreen?.();
      }
      if (p < 0.9) handedOffRef.current = false;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, mode, onReachScreen, use3D, runwayRef, sceneFadeFrom, sceneFadeTo, liveFrom, alwaysLive, onFrame, arrive, words]);

  // Shut Down: start dived-in and glide back to the top.
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
      const runTop = runwayRef.current ? runwayRef.current.offsetTop : 0;
      const max = maxScroll();
      cancelRef.current = tweenScroll(runTop + (max - runTop) * CLOSED_AT, CLOSE_MS, () => onClosed?.());
    }, 120);
    return () => {
      clearTimeout(t);
      cancelRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className={`${styles.room} ${className}`} aria-hidden>
      {children}
      <div ref={glowRef} className={styles.glow} style={{ '--room': '122 140 255' }} />
      <div ref={wordsRef} className={`${styles.words} ${wordsOnTop ? styles.wordsTop : ''}`}>
        {words && CHAPTERS.map((ch, i) => (
          <div
            key={ch.id}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className={styles.chapter}
          >
            <span className={styles.word} style={{ '--c': ch.color }} aria-label={ch.line.replace('*', '')}>
              {ch.line.split(' ').map((w, j) => {
                const key = w.startsWith('*');
                return (
                  <span key={j} className={`${styles.lineWord} ${key ? styles.key : ''}`} aria-hidden>
                    {[...(key ? w.slice(1) : w)].map((c, k) => (
                      <span key={k} className={styles.letter} data-letter="">
                        {c}
                      </span>
                    ))}
                  </span>
                );
              })}
            </span>
            {/* What it buys, a beat after its line, word by word. */}
            <span className={styles.caption} style={{ '--c': ch.color }}>
              {ch.caption.split(' ').map((w, j) => (
                <span key={j} className={styles.captionWord} data-caption-word="">
                  {w}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      {use3D && (
        <div ref={sceneRef} className={styles.scene}>
          <SceneBoundary onFail={() => setUse3D(false)}>
            <Suspense fallback={null}>
              <World
                progressRef={progressRef}
                screenOnRef={screenOnRef}
                swayRef={reduced || !sway ? undefined : swayRef}
                onReady={handleReady}
                live={live}
                active={active}
                poses={poses}
                anchorRef={wordsOnTop ? anchorRef : undefined}
                logoRef={logoRef}
                beats={beats}
              />
            </Suspense>
          </SceneBoundary>
        </div>
      )}
      {words && (
        <span className={styles.rail}>
          <span ref={railRef} />
        </span>
      )}
    </div>
  );
}
