import { useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './KerningCat.module.css';

// Kerning, the desktop cat (after the desktop pets of the early 2000s, like
// MyFelix): a tuxedo cat who lives on the desktop. He wanders the floor above
// the Dock, sits, grooms and naps. Pick him up and he dangles; let go and he
// falls onto whatever is under him, the top of a window included, and rides
// it when it moves. Click him to stroke him. Right-click (or double-click)
// for his menu: a mouse to hunt, a game of catch, a box to sit in, a nap.

const W = 64; // his size on screen, px
const H = 64;
const G = 2600; // gravity, px/s²
const WALK = 70; // px/s
const RUN = 260;
const FLOOR_GAP = 96; // the floor: this far above the bottom (clear of the Dock)
const LINES = ['mrrp.', 'your kerning is off.', 'that is not centred.', 'more whitespace.', 'feed me, then the brief.', 'nice portfolio.', 'purrr.'];

const floorY = () => window.innerHeight - FLOOR_GAP;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** Window tops he can stand on (title bars), top-most first. */
function surfaces() {
  return [...document.querySelectorAll('[data-window-titlebar]')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 80 && r.top > 30);
}

function FrontCat({ eyes }) {
  return (
    <svg viewBox="0 0 64 64" className={styles.svg} aria-hidden>
      <path className={styles.tail} d="M44 56c10 0 14-8 12-16" />
      <path className={styles.black} d="M18 60c-4-14 0-28 14-28s18 14 14 28z" />
      <path className={styles.white} d="M26 60c-2-10 1-19 6-19s8 9 6 19z" />
      <ellipse className={styles.white} cx="26" cy="60" rx="4.5" ry="3" />
      <ellipse className={styles.white} cx="38" cy="60" rx="4.5" ry="3" />
      <g className={styles.head}>
        <path className={styles.black} d="M17 14 19 0l10 9zM47 14 45 0 35 9z" />
        <path className={styles.pink} d="M19.5 10 20.5 3l5 5zM44.5 10 43.5 3l-5 5z" />
        <ellipse className={styles.black} cx="32" cy="18" rx="16" ry="14" />
        <path className={styles.white} d="M32 16c-3 4-8 6-8 11 0 3 4 5 8 5s8-2 8-5c0-5-5-7-8-11z" />
        {eyes === 'open' ? (
          <g className={styles.eyes}>
            <ellipse className={styles.iris} cx="25" cy="17" rx="3.6" ry="4" />
            <ellipse className={styles.iris} cx="39" cy="17" rx="3.6" ry="4" />
            <ellipse className={styles.pupil} cx="25" cy="17.3" rx="1.3" ry="3.3" />
            <ellipse className={styles.pupil} cx="39" cy="17.3" rx="1.3" ry="3.3" />
            <circle className={styles.white} cx="26" cy="15.5" r="0.9" />
            <circle className={styles.white} cx="40" cy="15.5" r="0.9" />
          </g>
        ) : (
          <path className={styles.lid} d={eyes === 'happy' ? 'M21.5 18c2-3 5-3 7 0M35.5 18c2-3 5-3 7 0' : 'M21.5 17c2 2 5 2 7 0M35.5 17c2 2 5 2 7 0'} />
        )}
        <path className={styles.pink} d="M30.5 22.5h3L32 24.2z" />
        <path className={styles.line} d="M32 24.2v1.6M32 25.8c-1 1.2-2.6 1.2-3.4.4M32 25.8c1 1.2 2.6 1.2 3.4.4" />
        <path className={styles.whisker} d="M24 24 13 22M24 26l-11 1M40 24l11-2M40 26l11 1" />
      </g>
    </svg>
  );
}

function SideCat() {
  return (
    <svg viewBox="0 0 64 64" className={styles.svg} aria-hidden>
      <path className={styles.tail} d="M14 38c-6-2-9-9-6-16" />
      <rect className={`${styles.black} ${styles.legB}`} x="16" y="40" width="6" height="18" rx="3" />
      <rect className={`${styles.black} ${styles.legA}`} x="22" y="40" width="6" height="18" rx="3" />
      <rect className={`${styles.black} ${styles.legA}`} x="40" y="40" width="6" height="18" rx="3" />
      <rect className={`${styles.black} ${styles.legB}`} x="46" y="40" width="6" height="18" rx="3" />
      <ellipse className={styles.white} cx="43" cy="57.5" rx="3.6" ry="2" />
      <ellipse className={styles.white} cx="49" cy="57.5" rx="3.6" ry="2" />
      <ellipse className={styles.black} cx="33" cy="38" rx="20" ry="10" />
      <ellipse className={styles.white} cx="47" cy="42" rx="6" ry="6" />
      <g className={styles.sideHead}>
        <path className={styles.black} d="M45 18l2-12 8 9zM56 16l5-10 2 12z" />
        <circle className={styles.black} cx="53" cy="24" r="10" />
        <path className={styles.white} d="M58 24c3 0 5 3 5 5s-3 3-6 3-5-2-4-4z" />
        <ellipse className={styles.iris} cx="57" cy="21.5" rx="2.6" ry="3" />
        <ellipse className={styles.pupil} cx="57.6" cy="21.7" rx="1" ry="2.5" />
        <path className={styles.pink} d="M62 26.5l1.6-.8.2 1.8z" />
        <path className={styles.whisker} d="M60 29l8-1M60 30.5l8 1.5" />
      </g>
    </svg>
  );
}

function Box() {
  return (
    <svg viewBox="0 0 80 50" className={styles.boxSvg} aria-hidden>
      <path fill="#c99a5b" d="M6 14h68v34H6z" />
      <path fill="#b3854a" d="M6 14 0 4h34l6 10zM74 14l6-10H46l-6 10z" />
      <path stroke="#8e6630" strokeWidth="1" d="M6 24h68" fill="none" />
    </svg>
  );
}

function Mouse() {
  return (
    <svg viewBox="0 0 30 16" className={styles.mouseSvg} aria-hidden>
      <path d="M2 12c4 0 6-2 6-4" fill="none" stroke="#777" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="17" cy="10" rx="10" ry="5.5" fill="#9a9aa2" />
      <circle cx="21" cy="5" r="3" fill="#b7b7bf" />
      <circle cx="25" cy="9" r="1" fill="#222" />
    </svg>
  );
}

export default function KerningCat() {
  const { petVisible, togglePet } = useOS();
  const rootRef = useRef(null);
  const toyRef = useRef(null);
  const [pose, setPose] = useState('walk'); // walk run sit groom sleep purr dangle fall box
  const [dir, setDir] = useState(1);
  const [say, setSay] = useState('');
  const [menu, setMenu] = useState(null);
  const [toy, setToy] = useState(null); // 'mouse' | 'box' | null
  const s = useRef({ x: -W, y: 0, vx: 0, vy: 0, mode: 'walk', target: null, perch: null, perchDx: 0, until: 0, drag: null, toyX: 0, toyV: 0 });

  // Only re-render when the pose or the way he faces changes.
  const poseRef = useRef(pose);
  const dirRef = useRef(dir);
  const setPoseIf = (p) => {
    if (poseRef.current !== p) {
      poseRef.current = p;
      setPose(p);
    }
  };
  const face = (d) => {
    if (d && dirRef.current !== d) {
      dirRef.current = d;
      setDir(d);
    }
  };
  const sayTimer = useRef(0);
  const speak = (text, ms = 2200) => {
    setSay(text);
    clearTimeout(sayTimer.current);
    sayTimer.current = setTimeout(() => setSay(''), ms);
  };

  useEffect(() => {
    if (!petVisible) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      s.current.x = 80;
      s.current.y = floorY();
      s.current.mode = 'sit';
    }
    const st = s.current;
    st.y = floorY();
    let raf = 0;
    let last = performance.now();
    // What to do next, when left to himself.
    const decide = (now) => {
      const r = Math.random();
      if (r < 0.4) {
        st.mode = 'walk';
        const lo = st.perch ? st.perch.r.left + 10 : 10;
        const hi = st.perch ? st.perch.r.right - W - 10 : window.innerWidth - W - 170;
        st.target = lo + Math.random() * Math.max(0, hi - lo);
      } else if (r < 0.65) st.mode = 'sit';
      else if (r < 0.8) st.mode = 'groom';
      else st.mode = 'sleep';
      st.until = now + (st.mode === 'sleep' ? 14000 : 3000 + Math.random() * 4000);
      if (Math.random() < 0.12) speak(pick(LINES));
    };
    const surfaceUnder = (x, yTop) => {
      const mid = x + W / 2;
      let best = { y: floorY(), perch: null };
      surfaces().forEach((sf) => {
        if (mid > sf.r.left + 8 && mid < sf.r.right - 8 && sf.r.top >= yTop - 2 && sf.r.top < best.y) best = { y: sf.r.top, perch: sf };
      });
      return best;
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const el = rootRef.current;
      if (!el) return;

      if (st.mode === 'drag') {
        setPoseIf('dangle');
      } else if (st.mode === 'fall') {
        st.vy += G * dt;
        st.y += st.vy * dt;
        const under = surfaceUnder(st.x, st.y - st.vy * dt);
        if (st.y >= under.y) {
          st.y = under.y;
          st.vy = 0;
          st.perch = under.perch ? { el: under.perch.el, r: under.perch.r } : null;
          st.perchDx = under.perch ? st.x - under.perch.r.left : 0;
          st.mode = 'sit';
          st.until = now + 1500;
          el.classList.remove(styles.land);
          void el.offsetWidth;
          el.classList.add(styles.land);
        }
        setPoseIf('fall');
      } else {
        // Riding a window: follow it; if it is gone or minimized, fall.
        if (st.perch) {
          const r = st.perch.el.isConnected ? st.perch.el.getBoundingClientRect() : null;
          if (!r || r.width < 80) {
            st.perch = null;
            st.mode = 'fall';
          } else {
            st.perch.r = r;
            st.y = r.top;
            if (st.mode !== 'walk' && st.mode !== 'run') st.x = r.left + st.perchDx;
          }
        } else {
          st.y = floorY();
        }
        if (st.mode === 'walk' || st.mode === 'run' || st.mode === 'hunt' || st.mode === 'flee' || st.mode === 'tobox') {
          let target = st.target;
          let speed = st.mode === 'walk' ? WALK : RUN;
          if (st.mode === 'hunt') target = st.toyX - W / 2;
          if (st.mode === 'tobox') target = st.toyX + 8;
          if (st.mode === 'flee') {
            const away = st.x + W / 2 < (window.__kernPtr ?? 0) ? -1 : 1;
            target = st.x + away * 200;
          }
          const lo = st.perch ? st.perch.r.left : 0;
          const hi = st.perch ? st.perch.r.right - W : window.innerWidth - W;
          target = Math.max(lo, Math.min(hi, target ?? st.x));
          const d = target - st.x;
          face(Math.sign(d));
          const step = Math.sign(d) * Math.min(Math.abs(d), speed * dt);
          st.x += step;
          if (st.perch) st.perchDx = st.x - st.perch.r.left;
          setPoseIf(st.mode === 'walk' ? 'walk' : 'run');
          if (Math.abs(d) < 2) {
            if (st.mode === 'hunt') {
              speak('got it.');
              setToy(null);
              st.mode = 'groom';
              st.until = now + 3000;
            } else if (st.mode === 'tobox') {
              st.mode = 'box';
              st.until = now + 16000;
            } else if (st.mode === 'flee') {
              // cornered: keep going the other way
            } else {
              st.mode = 'sit';
              st.until = now + 2500;
            }
          }
          if (st.mode === 'flee' && now > st.until) {
            speak('you win. this time.');
            st.mode = 'sit';
            st.until = now + 3000;
          }
        } else {
          setPoseIf(st.mode === 'groom' ? 'groom' : st.mode === 'sleep' ? 'sleep' : st.mode === 'purr' ? 'purr' : st.mode === 'box' ? 'box' : 'sit');
          if (now > st.until) {
            if (st.mode === 'box') setToy(null);
            decide(now);
          }
        }
      }
      // The toy mouse scurries along the floor.
      if (toyRef.current && st.toyKind === 'mouse') {
        st.toyX += st.toyV * dt;
        if (st.toyX < 20 || st.toyX > window.innerWidth - 220) st.toyV *= -1;
        if (Math.random() < 0.01) st.toyV *= -1;
        toyRef.current.style.transform = `translate3d(${st.toyX.toFixed(1)}px, ${(floorY() - 16).toFixed(1)}px, 0) scaleX(${st.toyV < 0 ? -1 : 1})`;
      }
      el.style.transform = `translate3d(${st.x.toFixed(1)}px, ${(st.y - H).toFixed(1)}px, 0)`;
    };
    st.mode = 'walk';
    st.target = 140;
    raf = requestAnimationFrame(frame);
    const onMove = (e) => {
      window.__kernPtr = e.clientX;
      if (st.mode === 'flee') {
        const r = rootRef.current?.getBoundingClientRect();
        if (r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
          speak('ok ok, you got me.');
          st.mode = 'purr';
          st.until = performance.now() + 2500;
        }
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petVisible]);

  // Picked up by the scruff: he dangles where the pointer is; let go, he falls.
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const st = s.current;
    const start = { x: e.clientX, y: e.clientY, moved: false };
    const prev = st.mode;
    const move = (ev) => {
      if (!start.moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return;
      start.moved = true;
      st.mode = 'drag';
      st.perch = null;
      st.x = ev.clientX - W / 2;
      st.y = ev.clientY + H - 8;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (start.moved) {
        st.mode = 'fall';
        st.vy = 0;
      } else {
        // A click: a stroke.
        st.mode = 'purr';
        st.until = performance.now() + 2600;
        speak(prev === 'sleep' ? '…mrrp?' : 'purrr.');
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const openMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 230);
    const y = Math.max(40, e.clientY - 280);
    setMenu({ x, y });
  };
  const act = (fn) => () => {
    setMenu(null);
    fn(s.current, performance.now());
  };
  const ACTIONS = [
    ['Stroke Kerning', (st, now) => ((st.mode = 'purr'), (st.until = now + 3000), speak('purrrrr.'))],
    ['Mouse hunt', (st) => {
      st.perch = null;
      st.toyKind = 'mouse';
      st.toyX = st.x > window.innerWidth / 2 ? 60 : window.innerWidth - 300;
      st.toyV = st.toyX < 100 ? 120 : -120;
      setToy('mouse');
      st.mode = 'hunt';
    }],
    ['Catch me if you can', (st, now) => ((st.mode = 'flee'), (st.until = now + 9000), speak('catch me.'))],
    ['Cat-in-a-box', (st) => {
      st.perch = null;
      st.toyKind = 'box';
      st.toyX = Math.max(40, Math.min(window.innerWidth - 300, st.x + (Math.random() < 0.5 ? -220 : 220)));
      setToy('box');
      st.mode = 'tobox';
    }],
    ['Nap time', (st, now) => ((st.mode = 'sleep'), (st.until = now + 20000))],
  ];

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  if (!petVisible) return null;
  const side = pose === 'walk' || pose === 'run';
  return (
    <>
      {toy === 'box' && (
        <div className={styles.box} style={{ transform: `translate3d(${s.current.toyX}px, ${floorY() - 44}px, 0)` }}>
          <Box />
        </div>
      )}
      {toy === 'mouse' && (
        <div ref={toyRef} className={styles.toy}>
          <Mouse />
        </div>
      )}
      <div
        ref={rootRef}
        className={`${styles.cat} ${styles[pose]}`}
        style={{ '--dir': dir }}
        onPointerDown={onPointerDown}
        onContextMenu={openMenu}
        onDoubleClick={openMenu}
        role="button"
        tabIndex={0}
        aria-label="Kerning, the desktop cat. Click to stroke, drag to pick up, right-click for his menu."
      >
        <div className={styles.flip}>{side ? <SideCat /> : <FrontCat eyes={pose === 'sleep' ? 'closed' : pose === 'purr' ? 'happy' : 'open'} />}</div>
        {pose === 'sleep' && <span className={styles.zzz}>z z z</span>}
        {pose === 'purr' && <span className={styles.heart}>♥</span>}
        {say && <span className={styles.say}>{say}</span>}
      </div>
      {menu && (
        <div className={styles.menu} style={{ left: menu.x, top: menu.y }} onPointerDown={(e) => e.stopPropagation()} role="menu">
          <div className={styles.menuHead}>
            <FrontCat eyes="open" />
            <b>Kerning</b>
          </div>
          {ACTIONS.map(([label, fn]) => (
            <button key={label} type="button" role="menuitem" onClick={act(fn)}>
              {label}
            </button>
          ))}
          <i className={styles.sep} />
          <button type="button" role="menuitem" onClick={() => (setMenu(null), togglePet())}>
            Hide Kerning
          </button>
        </div>
      )}
    </>
  );
}
