// Q2, the Y2K version (try it with ?about=y2k), after an early-2000s tech
// catalogue: a deep ice-blue night with a fine grid, the statement in wide
// brushed-chrome capitals, small mono labels like a spec sheet, a wireframe
// globe turning on the right and the four things he does as thin glass
// panels. It writes itself in with the scroll like the others.

import { Fragment, useMemo, useRef } from 'react';
import { ASIDE, PILLARS, STATEMENT, useStylesheet, useWrite } from './MePanel.jsx';
import styles from './MePanelY2K.module.css';

const FONTS = 'https://fonts.googleapis.com/css2?family=Michroma&family=Space+Mono:wght@400;700&display=swap';
// The globe's meridians: each starts a turn this far through (0..1).
const MERIDIANS = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];
const PARALLELS = [-0.66, -0.33, 0, 0.33, 0.66];

export default function MePanelY2K({ progress, span, arrive, instant }) {
  const rootRef = useRef(null);
  useStylesheet(FONTS);
  const words = useMemo(() => STATEMENT.flat(), []);
  const total = words.length + 2 + PILLARS.length * 0.5;
  useWrite(rootRef, { progress, span, arrive, instant, total });
  const after = words.length;

  let n = 0;
  return (
    <section ref={rootRef} className={styles.y2k} aria-label="About Ken">
      <span className={styles.sky} aria-hidden />
      <span className={styles.grid} aria-hidden />

      {/* The spec sheet's margins. */}
      <div className={styles.meta} aria-hidden>
        <span>KN—02 / About</span>
        <span className={styles.metaMid}>
          <i className={styles.live} /> Online
        </span>
        <span>17.385° N · 78.486° E</span>
      </div>

      <div className={styles.copy}>
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
        <p className={styles.aside} style={{ '--i': after + 0.5 }}>
          <span aria-hidden>▸ </span>
          {ASIDE}
        </p>
      </div>

      {/* A wireframe globe, turning. */}
      <svg className={styles.globe} viewBox="-110 -110 220 220" style={{ '--i': after + 1 }} aria-hidden>
        <circle r="100" className={styles.rim} />
        {PARALLELS.map((y) => (
          <ellipse key={y} cy={y * 100} rx={Math.sqrt(1 - y * y) * 100} ry={Math.sqrt(1 - y * y) * 16} />
        ))}
        {MERIDIANS.map((d) => (
          <ellipse key={d} rx="100" ry="100" className={styles.meridian} style={{ '--d': d }} />
        ))}
        <line x1="-108" x2="108" className={styles.axis} />
      </svg>
      <span className={styles.globeTag} style={{ '--i': after + 1.2 }} aria-hidden>
        Fig. 01 — Always on
      </span>

      <ol className={styles.panels} aria-label="What I specialise in">
        {PILLARS.map((p, k) => (
          <li key={p.name} className={styles.panel} style={{ '--i': after + 1.5 + k * 0.5 }}>
            <span className={styles.panelNum}>[0{k + 1}]</span>
            <span className={styles.panelName}>{p.name}</span>
            <span className={styles.panelLine}>{p.line}</span>
          </li>
        ))}
      </ol>

      <div className={styles.foot} aria-hidden>
        <span className={styles.barcode} />
        <span>© 2026 Kenneth Nathanael · Designer</span>
      </div>
    </section>
  );
}
