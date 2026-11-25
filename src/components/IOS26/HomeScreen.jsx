import { useCallback, useEffect, useRef, useState } from 'react';
import StatusBar from './StatusBar.jsx';
import AppTile from './AppTile.jsx';
import { HOME_PAGES, DOCK, folderFace } from './apps.js';
import styles from './ios26.module.css';

/* Home screen, Figma "Examples/Home Screen": 4 columns of 72px cells, 64px
   icons, 5px to the label, row pitch ≈100px, glass dock 103px tall. Two pages,
   swiped between (a finger, or a mouse drag), with page dots above the dock. */

function Cell({ app, onOpen, hideLabel }) {
  return (
    <button
      type="button"
      className={styles.cell}
      onClick={(e) => onOpen?.(app, e.currentTarget.querySelector('[data-icon]'))}
      aria-label={app.label}
    >
      <div data-icon className={styles.iconBox}>
        {app.folder ? (
          <div className={styles.folder}>
            {folderFace(app.folder).map((a) => (
              <div key={a.id} className={styles.mini}>
                <AppTile app={a} />
              </div>
            ))}
          </div>
        ) : (
          <AppTile app={app} />
        )}
        {app.badge ? <span className={styles.badge}>{app.badge}</span> : null}
      </div>
      {!hideLabel && <span className={styles.label}>{app.label}</span>}
    </button>
  );
}

export default function HomeScreen({ locked = false, under = false, reveal = 0, time, onOpen, onStatusTap, pagerRef, onPage, scale = 1 }) {
  const own = useRef(null);
  const pager = pagerRef || own;
  const [page, setPage] = useState(0);
  const drag = useRef(null);
  const dragged = useRef(false);

  const onScroll = useCallback(() => {
    const el = pager.current;
    if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    setPage((cur) => {
      if (cur !== p) onPage?.(p);
      return p;
    });
  }, [pager, onPage]);

  // A mouse can't swipe, so the lab and desktop drag the page (a finger scrolls natively).
  const onDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { x: e.clientX, left: pager.current.scrollLeft };
    dragged.current = false;
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) {
      dragged.current = true;
      pager.current.style.scrollSnapType = 'none';
      pager.current.scrollLeft = d.left - dx / scale;
    }
  };
  const onUp = () => {
    const el = pager.current;
    if (!drag.current || !el) return;
    drag.current = null;
    el.style.scrollSnapType = '';
    el.scrollTo({ left: Math.round(el.scrollLeft / el.clientWidth) * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (locked && pager.current) pager.current.scrollLeft = 0;
  }, [locked, pager]);

  // While the lock screen is being dragged up, the icons fade and scale in
  // under the finger (0 = hidden, 1 = fully there), as on iOS.
  const revealing = locked && reveal > 0;
  return (
    <div
      className={`${styles.home} ${locked ? styles.homeLocked : ''} ${under ? styles.under : ''}`}
      style={revealing ? { opacity: reveal, transform: `scale(${0.94 + 0.06 * reveal})`, transition: 'none' } : undefined}
    >
      <div
        ref={pager}
        className={styles.pager}
        onScroll={onScroll}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.stopPropagation();
            e.preventDefault();
            dragged.current = false;
          }
        }}
      >
        {HOME_PAGES.map((apps, i) => (
          <section key={i} className={styles.page} aria-label={`Home screen ${i + 1} of ${HOME_PAGES.length}`}>
            <div className={styles.grid}>
              {apps.map((a) => (
                <Cell key={a.id} app={a} onOpen={onOpen} />
              ))}
              {Array.from({ length: (4 - (apps.length % 4)) % 4 }, (_, j) => (
                <div key={`e${j}`} className={`${styles.cell} ${styles.cellEmpty}`} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <StatusBar time={time} onTap={onStatusTap} />

      <div className={styles.dots} role="tablist" aria-label="Home screen pages">
        {HOME_PAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={page === i}
            aria-label={`Page ${i + 1}`}
            className={`${styles.dot} ${page === i ? styles.dotOn : ''}`}
            onClick={() => pager.current?.scrollTo({ left: i * pager.current.clientWidth, behavior: 'smooth' })}
          />
        ))}
      </div>

      <div className={`${styles.dock} ${styles.glass} ${styles.glassBlur}`}>
        {DOCK.map((a) => (
          <Cell key={a.id} app={a} onOpen={onOpen} hideLabel />
        ))}
      </div>
    </div>
  );
}
