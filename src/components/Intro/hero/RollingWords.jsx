// "I design ___" with the last word rolling like a slot reel: the old word's
// letters roll up and out while the new word's roll up into place, one
// letter after another. Plain CSS keyframes (off the main thread); React
// only swaps which word is current. Nothing follows the word on its line,
// so its changing width never pushes other content around.

import { useEffect, useState } from 'react';
import styles from './hero.module.css';

const HOLD_MS = 2200;
/* Keep in sync with hero.module.css: .reelOut runs 420ms, .reelFadeOut 200ms. */
const REEL_OUT_MS = 420;
const FADE_OUT_MS = 200;
const STAGGER_MS = 28;

export default function RollingWords({ words, reduced }) {
  const [state, setState] = useState({ i: 0, prev: null });

  useEffect(() => {
    // The ghost stays until its last (most-delayed) letter has rolled out.
    const longest = Math.max(...words.map((w) => w.length));
    const outMs = reduced ? FADE_OUT_MS : REEL_OUT_MS + STAGGER_MS * (longest - 1);
    let clear = 0;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setState((s) => ({ i: (s.i + 1) % words.length, prev: s.i }));
      clearTimeout(clear);
      clear = setTimeout(() => setState((s) => ({ ...s, prev: null })), outMs);
    }, HOLD_MS);
    return () => {
      clearInterval(id);
      clearTimeout(clear);
    };
  }, [words, reduced]);

  const reel = (word, cls) =>
    Array.from(word).map((ch, k) => (
      <span key={k} className={styles.reelCell}>
        <span className={cls} style={reduced ? undefined : { animationDelay: `${k * STAGGER_MS}ms` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      </span>
    ));

  return (
    <span className={styles.reel}>
      <span className={styles.srOnly}>{words.join(', ')}</span>
      <span aria-hidden className={styles.reelWord} key={`in-${state.i}`}>
        {reel(words[state.i], reduced ? styles.reelFade : styles.reelIn)}
      </span>
      {state.prev !== null && (
        <span aria-hidden className={`${styles.reelWord} ${styles.reelGhost}`} key={`out-${state.prev}`}>
          {reel(words[state.prev], reduced ? styles.reelFadeOut : styles.reelOut)}
        </span>
      )}
    </span>
  );
}
