// Q2, the Y2K version (try it with ?about=y2k): the same words, dressed for
// 2001. An iridescent sky with sparkles, the statement in bubbly chrome on a
// glossy little window ("about_ken.exe"), what he plays on a pixel ticker,
// and the four things he does as glossy aqua chips. It writes itself in with
// the scroll like the others.

import { Fragment, useMemo, useRef } from 'react';
import { ASIDE, PILLARS, STATEMENT, useStylesheet, useWrite } from './MePanel.jsx';
import styles from './MePanelY2K.module.css';

const FONTS = 'https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Silkscreen&display=swap';
// Sparkles: where (%), how big (px), when they twinkle (s).
const SPARKLES = [
  [8, 14, 22, 0],
  [62, 9, 16, 1.1],
  [88, 22, 28, 0.4],
  [74, 58, 14, 1.7],
  [40, 70, 18, 0.8],
  [93, 74, 12, 2.2],
  [18, 80, 16, 1.4],
];

export default function MePanelY2K({ progress, span, arrive, instant }) {
  const rootRef = useRef(null);
  useStylesheet(FONTS);
  const words = useMemo(() => STATEMENT.flat(), []);
  const total = words.length + 1.5 + PILLARS.length;
  useWrite(rootRef, { progress, span, arrive, instant, total });

  let n = 0;
  return (
    <section ref={rootRef} className={styles.y2k} aria-label="About Ken">
      <span className={styles.sky} aria-hidden />
      {SPARKLES.map(([x, y, s, d], i) => (
        <span key={i} className={styles.sparkle} style={{ left: `${x}%`, top: `${y}%`, '--s': `${s}px`, '--d': `${d}s` }} aria-hidden>
          ✦
        </span>
      ))}
      <span className={styles.star} aria-hidden />

      <div className={styles.window}>
        <div className={styles.titleBar} aria-hidden>
          <span className={styles.titleDots}>
            <i />
            <i />
            <i />
          </span>
          about_ken.exe
        </div>
        <h2 className={styles.statement}>
          <span className={styles.srOnly}>{words.join(' ')}</span>
          {STATEMENT.map((line, li) => (
            <span key={li} className={styles.line} aria-hidden>
              {line.map((w, k) => {
                const i = n++;
                return (
                  <Fragment key={w + i}>
                    {k > 0 && ' '}
                    <span className={styles.word} style={{ '--i': i }}>
                      {w}
                    </span>
                  </Fragment>
                );
              })}
            </span>
          ))}
        </h2>
        <div className={styles.ticker} style={{ '--i': words.length + 0.5 }}>
          <span>
            {ASIDE} ★ {ASIDE} ★ {ASIDE} ★{' '}
          </span>
        </div>
      </div>

      <ol className={styles.chips} aria-label="What I specialise in">
        {PILLARS.map((p, k) => (
          <li key={p.name} className={styles.chip} style={{ '--i': words.length + 1.5 + k }}>
            <span className={styles.chipNum}>0{k + 1}</span>
            <span className={styles.chipName}>{p.name}</span>
            <span className={styles.chipLine}>{p.line}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
