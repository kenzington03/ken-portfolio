// Mat Voyce-style entrance: a giant condensed counter that tracks real
// loading (the MacBook model, work textures, fonts), then a choice between
// sound and silence. The click doubles as the user gesture browsers require
// before any audio may play.

import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import styles from './Intro2.module.css';

const MIN_MS = 2200; // never flash: the count takes at least this long
const MAX_WAIT_MS = 10000; // assets never started (blocked, offline): let them in anyway
const EXIT_MS = 1000;

export default function Loader({ onEnter, reduced, expectAssets = true }) {
  const { progress, active } = useProgress();
  const [shown, setShown] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const start = useRef(performance.now());
  const load = useRef({ active, progress, seen: false, expectAssets });
  load.current.active = active;
  load.current.progress = progress;
  load.current.expectAssets = expectAssets;
  if (active) load.current.seen = true;

  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true)) ?? setFontsReady(true);
  }, []);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      const elapsed = performance.now() - start.current;
      const floor = Math.min(100, (elapsed / MIN_MS) * 100);
      // "Not loading" only means done once loading has actually begun: the 3D
      // chunk is lazy, so for a while nothing has even been requested yet.
      const l = load.current;
      const settled = l.seen || !l.expectAssets || elapsed > MAX_WAIT_MS;
      const real = l.active ? l.progress : settled ? 100 : 0;
      setShown((s) => Math.max(s, Math.floor(Math.min(floor, real))));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ready = shown >= 100 && fontsReady;

  const enter = (withSound) => {
    if (leaving) return;
    setLeaving(true);
    onEnter(withSound, reduced ? 0 : EXIT_MS);
  };

  return (
    <div className={`${styles.loader} ${leaving ? styles.loaderOut : ''}`} role="dialog" aria-modal="true" aria-label="Loading Ken's portfolio">
      <div className={styles.loaderTop}>
        <span>Kenneth Nathanael</span>
        <span>Portfolio, 2026</span>
      </div>

      <div className={`${styles.loaderChoice} ${ready ? styles.loaderChoiceOn : ''}`} aria-hidden={!ready}>
        <p className={styles.loaderHint}>Best with sound on.</p>
        <div className={styles.loaderButtons}>
          <button type="button" className={styles.enterSound} onClick={() => enter(true)} disabled={!ready} autoFocus>
            <SoundIcon /> Enter with sound
          </button>
          <button type="button" className={styles.enterSilent} onClick={() => enter(false)} disabled={!ready}>
            Enter in silence
          </button>
        </div>
      </div>

      <div className={styles.counter} aria-live="polite" aria-atomic="true">
        {/* Announce twice at most (loading, then loaded), never every percent. */}
        <span className={styles.srOnly}>{ready ? 'Loaded. Choose how to enter.' : 'Loading…'}</span>
        <span aria-hidden>{String(shown).padStart(3, '0')}</span>
      </div>
    </div>
  );
}

const SoundIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M3 8v4M7 5v10M11 7v6M15 4v12" />
  </svg>
);
