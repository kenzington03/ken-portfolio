// Q2, the collage version (try it with ?about=fleur), after a fashion
// lookbook: a pale sky, the statement in huge black type down the left with
// a yellow highlighter looped round one word, Ken cut out on the right with
// a sticker edge, marker doodles drawn in round him, a strip of film with a
// piece of work in it, a pink button, a credit up the side and the four
// things he does as small print under the button. The doodles are drawn shapes, not a
// handwriting font. It writes itself in with the scroll like the others.

import { Fragment, useMemo, useRef } from 'react';
import { ASIDE, PILLARS, STATEMENT, useWrite } from './MePanel.jsx';
import styles from './MePanelFleur.module.css';

// Each statement line, and the word the highlighter loops.
const LOOPED = 'questioning';

export default function MePanelFleur({ progress, span, arrive, instant, onSeeWork }) {
  const rootRef = useRef(null);
  const words = useMemo(() => STATEMENT.flat(), []);
  const total = words.length + 4 + PILLARS.length * 0.5;
  useWrite(rootRef, { progress, span, arrive, instant, total });
  const after = words.length; // beats after the words: the doodles, the rest

  let n = 0;
  return (
    <section ref={rootRef} className={styles.fleur} aria-label="About Ken">
      <span className={styles.sky} aria-hidden />
      <span className={styles.grain} aria-hidden />

      <p className={styles.side} aria-hidden>
        Kenneth Nathanael © 2026 · Designer · India
      </p>

      <div className={styles.copy}>
      <h2 className={styles.statement}>
        <span className={styles.srOnly}>{words.join(' ')}</span>
        {STATEMENT.map((line, li) => (
          <span key={li} className={styles.line} aria-hidden>
            {line.map((w, k) => {
              const i = n++;
              const looped = w.toLowerCase() === LOOPED;
              return (
                <Fragment key={w + i}>
                  {k > 0 && ' '}
                  <span className={`${styles.word} ${looped ? styles.looped : ''}`} style={{ '--i': i }}>
                    {w}
                    {looped && (
                      <svg className={styles.loop} viewBox="0 0 400 120" preserveAspectRatio="none" style={{ '--i': after }} aria-hidden>
                        <path pathLength="1" d="M30 70C40 20 200 8 330 22c60 7 70 40 40 62-50 34-240 34-300 10C20 76 40 40 120 30" />
                      </svg>
                    )}
                  </span>
                </Fragment>
              );
            })}
          </span>
        ))}
      </h2>

      <p className={styles.aside} style={{ '--i': after + 1 }}>
        {ASIDE}
      </p>

      <button type="button" className={styles.cta} style={{ '--i': after + 1.5 }} onClick={() => onSeeWork?.()}>
        See the work
        <svg viewBox="0 0 24 12" aria-hidden>
          <path d="M1 6h21M17 1l5 5-5 5" />
        </svg>
      </button>

      <ol className={styles.foot} aria-label="What I specialise in">
        {PILLARS.map((p, k) => (
          <li key={p.name} style={{ '--i': after + 4 + k * 0.5 }}>
            <b>{p.name}</b>
            <span>{p.line}</span>
          </li>
        ))}
      </ol>
      </div>

      {/* Ken, cut out, with his doodles. */}
      <div className={styles.cutout} style={{ '--i': after + 0.5 }} aria-hidden>
        <img src="/assets/hero/art/ken.webp" alt="" draggable={false} />
      </div>
      <svg className={`${styles.doodle} ${styles.flame}`} viewBox="0 0 80 140" style={{ '--i': after + 2 }} aria-hidden>
        <path pathLength="1" d="M40 136c-26-6-34-34-22-58 6-12 14-18 12-34 14 10 16 24 12 36 10-6 14-18 12-30 18 18 24 46 14 66-6 12-16 18-28 20zM40 128c-10-4-14-16-8-28 4 8 10 10 14 6 6 10 2 20-6 22z" />
      </svg>
      <svg className={`${styles.doodle} ${styles.squiggle}`} viewBox="0 0 120 220" style={{ '--i': after + 2.4 }} aria-hidden>
        <path pathLength="1" d="M60 4c-40 30 40 40 0 70s-50 40 0 66 40 50-10 76" />
      </svg>
      <svg className={`${styles.doodle} ${styles.arrow}`} viewBox="0 0 160 80" style={{ '--i': after + 2.8 }} aria-hidden>
        <path pathLength="1" d="M150 10C110 30 70 50 14 64M14 64l24-22M14 64l30 6" />
      </svg>
      <span className={styles.tape} style={{ '--i': after + 3 }} aria-hidden>
        the one asking why
      </span>

      {/* A strip of film with a piece of work in it. */}
      <div className={styles.film} style={{ '--i': after + 3.4 }} aria-hidden>
        <img src="/assets/me/collage/fluid-ai.webp" alt="" draggable={false} loading="lazy" />
      </div>

    </section>
  );
}
