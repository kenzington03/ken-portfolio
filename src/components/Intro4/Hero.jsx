// "Exposure" hero. The page opens like a shutter (two ink blades snap
// apart), then the name sets edge to edge. The portrait frame is a camera:
// click it and it takes a picture. When the walk-in clip exists, pass it as
// `video` and it plays inside the same frame.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { POSITIONING } from '../../data/about.js';
import { playShutter } from './sfx.js';
import styles from './Intro4.module.css';

const NAME = ['KEN', 'NATHANAEL'];
const HEAVY = 860;
const LIGHT = 220;
const EASE = [0.16, 1, 0.3, 1];
// Anybody gets wider as it gets heavier. Narrowing the width axis in step
// (measured: 860/78 ≈ 220/100) keeps every letter's advance constant, so the
// name always fills the row exactly and never shoves its neighbours.
const widthFor = (w) => (100 - ((w - LIGHT) * 22) / (HEAVY - LIGHT)).toFixed(1);

/** Fit the name to the row (width is weight-independent, see widthFor). */
function useFitName(rowRef, textRef) {
  useLayoutEffect(() => {
    const fit = () => {
      const row = rowRef.current;
      const text = textRef.current;
      if (!row || !text) return;
      text.style.fontSize = '100px';
      const w = text.scrollWidth;
      text.style.fontSize = `${Math.floor((row.clientWidth / w) * 100 * 0.995)}px`;
    };
    fit();
    // Anybody comes from Google Fonts and loads lazily: fit again once it's in.
    document.fonts?.load(`${HEAVY} 100px Anybody`).then(fit).catch(() => {});
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, [rowRef, textRef]);
}

/** Letters of NATHANAEL thicken under the pointer; KEN is always heavy. */
function usePointerWeight(textRef, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const letters = [...textRef.current.querySelectorAll('[data-l]')];
    const w = letters.map((el) => (el.dataset.solid ? HEAVY : LIGHT));
    const target = [...w];
    const pointer = { x: -1e4, y: -1e4 };
    let raf = 0;
    let idleSince = performance.now();
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      idleSince = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = (now) => {
      raf = 0;
      const rects = letters.map((el) => el.getBoundingClientRect());
      const radius = rects[0] ? rects[0].height * 1.4 : 200;
      const idle = now - idleSince > 1800;
      let moving = false;
      rects.forEach((r, i) => {
        if (letters[i].dataset.solid) return;
        const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
        const k = idle ? 0 : Math.max(0, 1 - d / radius);
        target[i] = LIGHT + (HEAVY - LIGHT) * k * k * (3 - 2 * k);
        w[i] += (target[i] - w[i]) * 0.16;
        if (Math.abs(target[i] - w[i]) > 1) moving = true;
        letters[i].style.setProperty('--w', w[i].toFixed(0));
        letters[i].style.setProperty('--d', widthFor(w[i]));
      });
      if (moving || !idle) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [textRef, enabled]);
}

function Camera({ video, poster, reduced, revealed }) {
  const [shots, setShots] = useState(0);
  const [flash, setFlash] = useState(0);
  const take = () => {
    playShutter();
    setShots((n) => n + 1);
    if (!reduced) setFlash((n) => n + 1);
  };
  return (
    <motion.button
      type="button"
      className={styles.camera}
      onClick={take}
      aria-label="Take a photo of Ken"
      initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 1.1, ease: EASE, delay: 0.25 }}
    >
      {video ? (
        <video className={styles.cameraMedia} src={video} poster={poster} autoPlay muted playsInline />
      ) : (
        <span className={styles.cameraSlot} aria-hidden>
          <span className={styles.slotHead} />
          <span className={styles.slotBody} />
          <span className={styles.slotNote}>Video slot: Ken walks in</span>
        </span>
      )}
      <span className={styles.cameraHint} aria-hidden>
        {shots === 0 ? 'Click to take a photo' : `${shots} photo${shots === 1 ? '' : 's'} taken`}
      </span>
      {flash > 0 && <span key={flash} className={styles.cameraFlash} aria-hidden />}
    </motion.button>
  );
}

export default function Hero({ reduced, instant, onOpenMac, onStory, video, poster }) {
  const [revealed, setRevealed] = useState(!!instant || reduced);
  const rowRef = useRef(null);
  const textRef = useRef(null);
  useFitName(rowRef, textRef);
  usePointerWeight(textRef, revealed && !reduced);

  // Curtain: hold a beat, snap open, click.
  useEffect(() => {
    if (revealed) return undefined;
    const t = setTimeout(() => {
      setRevealed(true);
      playShutter({ level: 0.6 });
    }, 520);
    return () => clearTimeout(t);
  }, [revealed]);

  const rise = (delay) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: revealed ? { opacity: 1, y: 0 } : undefined,
          transition: { duration: 0.9, ease: EASE, delay },
        };

  let li = 0;
  return (
    <section id="hero" className={styles.hero} aria-label="Ken Nathanael" data-hero>
      <div className={styles.heroTop}>
        <motion.p className={styles.chip} {...rise(0.35)}>
          {POSITIONING.chip.replace(/ · /g, ', ')}
        </motion.p>
        <motion.h1 className={styles.statement} {...rise(0.45)}>
          {POSITIONING.line}
        </motion.h1>
        <motion.div className={styles.ctas} {...rise(0.6)}>
          <button type="button" className={styles.btnPrimary} onClick={onOpenMac}>
            Open my Mac
          </button>
          <button type="button" className={styles.btnGhost} onClick={onStory}>
            Get to know me
          </button>
        </motion.div>
      </div>

      <Camera video={video} poster={poster} reduced={reduced} revealed={revealed} />

      <div ref={rowRef} className={styles.nameRow}>
        <p ref={textRef} className={styles.name} aria-label="Ken Nathanael">
          {NAME.map((word, wi) => (
            <span key={word} className={styles.nameWord} aria-hidden>
              {word.split('').map((ch, ci) => {
                const i = li++;
                const solid = wi === 0;
                return (
                  <span key={ci} className={styles.letterMask}>
                    <span
                      data-l
                      data-solid={solid ? '1' : undefined}
                      className={`${styles.letter} ${revealed ? styles.letterIn : ''}`}
                      style={{ '--i': i, '--w': solid ? HEAVY : LIGHT, '--d': widthFor(solid ? HEAVY : LIGHT) }}
                    >
                      {ch}
                    </span>
                  </span>
                );
              })}
            </span>
          ))}
        </p>
      </div>

      {!instant && !reduced && (
        <div className={`${styles.curtain} ${revealed ? styles.curtainOpen : ''}`} aria-hidden>
          <span className={styles.bladeTop} />
          <span className={styles.bladeBottom} />
        </div>
      )}
    </section>
  );
}
