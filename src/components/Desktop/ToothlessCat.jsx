import { useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { createCat } from './catEngine.js';
import styles from './ToothlessCat.module.css';

const MET = 'toothless-met'; // he's been introduced (once per browser)

// Toothless, the desktop cat (after the desktop pets of the early 2000s, like
// MyFelix). He is drawn and moved by catEngine.js; this places his canvas,
// the invisible handle you pick him up by, his speech and his menu.
export default function ToothlessCat() {
  const { petVisible, togglePet, helloDismissed } = useOS();
  const canvasRef = useRef(null);
  const hitRef = useRef(null);
  const engine = useRef(null);
  const [say, setSay] = useState('');
  const [menu, setMenu] = useState(null);
  const [laser, setLaser] = useState(false);
  const sayTimer = useRef(0);
  const lastTip = useRef(0);
  const hintRef = useRef(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (!petVisible || !canvasRef.current) return undefined;
    const cat = createCat({
      canvas: canvasRef.current,
      onSay: (text) => {
        setSay(text);
        clearTimeout(sayTimer.current);
        sayTimer.current = setTimeout(() => setSay(''), 1800);
      },
    });
    cat.setHitbox(hitRef.current);
    engine.current = cat;
    return () => {
      cat.destroy();
      engine.current = null;
    };
  }, [petVisible]);

  // He waits on the Dock until you're on the desktop.
  useEffect(() => {
    engine.current?.hold(!helloDismissed);
  }, [helloDismissed, petVisible]);

  // The first time you're on the Mac, a word about him, over his head.
  useEffect(() => {
    if (!petVisible || !helloDismissed) return undefined;
    try {
      if (localStorage.getItem(MET)) return undefined;
      // A first visit's tour introduces him; his own bubble would double it.
      if (localStorage.getItem('kenos:seen:onboarding-tour-v3') !== '1') return undefined;
    } catch {
      return undefined;
    }
    const t = setTimeout(() => setHint(true), 1800);
    return () => clearTimeout(t);
  }, [petVisible, helloDismissed]);
  useEffect(() => {
    engine.current?.setFollower(hint ? hintRef.current : null);
    if (!hint) return undefined;
    const t = setTimeout(() => met(), 15000);
    return () => clearTimeout(t);
  }, [hint]);
  const met = () => {
    setHint(false);
    try {
      localStorage.setItem(MET, '1');
    } catch {
      // (private mode: he'll say hello again next time)
    }
  };

  // The laser pointer: ten seconds of chasing the dot, then he gives up.
  useEffect(() => {
    engine.current?.laser(laser);
    document.body.classList.toggle(styles.laserBody, laser);
    if (!laser) return undefined;
    const t = setTimeout(() => setLaser(false), 10000);
    return () => {
      clearTimeout(t);
      document.body.classList.remove(styles.laserBody);
    };
  }, [laser]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  if (!petVisible) return null;
  const pick = (fn) => () => {
    setMenu(null);
    fn();
  };
  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      <div
        ref={hitRef}
        className={styles.hit}
        data-tour="cat"
        role="button"
        tabIndex={0}
        aria-label="Toothless, the desktop cat. Click to stroke him, drag to pick him up and throw him, right-click for more."
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          engine.current?.grab(e);
        }}
        onContextMenu={(e) => {
          // His menu only: the desktop's own must not open under it.
          e.preventDefault();
          e.stopPropagation();
          setMenu({ x: Math.min(e.clientX, window.innerWidth - 220), y: Math.max(40, e.clientY - 200) });
        }}
        onKeyDown={(e) => e.key === 'Enter' && engine.current?.stroke()}
        onPointerEnter={(e) => {
          // A reminder, now and then, of what a right-click does.
          if (e.pointerType !== 'mouse' || say || menu) return;
          const now = Date.now();
          if (now - lastTip.current < 45000) return;
          lastTip.current = now;
          setSay('Right-click for tricks');
          clearTimeout(sayTimer.current);
          sayTimer.current = setTimeout(() => setSay(''), 2200);
        }}
      >
        {say && <span className={styles.say}>{say}</span>}
      </div>
      {hint && (
        <div ref={hintRef} className={styles.hint} role="dialog" aria-label="Meet Toothless">
          <div className={styles.hintBubble}>
            <p className={styles.hintText}>
              <b>Hey, this is Toothless.</b> He lives on this Mac. Right-click him for tricks.
            </p>
            <div className={styles.hintActions}>
              <button
                type="button"
                className={styles.hintHide}
                onClick={() => {
                  met();
                  togglePet();
                }}
              >
                Hide him
              </button>
              <button type="button" className={styles.hintOk} onClick={met}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      {menu && (
        <div className={styles.menu} style={{ left: menu.x, top: menu.y }} onPointerDown={(e) => e.stopPropagation()} role="menu">
          <b className={styles.menuHead}>Toothless</b>
          <button type="button" role="menuitem" onClick={pick(() => engine.current?.stroke())}>
            Stroke him
          </button>
          <button type="button" role="menuitem" onClick={pick(() => setLaser(true))}>
            Laser pointer
          </button>
          <button type="button" role="menuitem" onClick={pick(() => engine.current?.yarn())}>
            Ball of yarn
          </button>
          <button type="button" role="menuitem" onClick={pick(() => engine.current?.zoomies())}>
            Zoomies
          </button>
          <button type="button" role="menuitem" onClick={pick(() => engine.current?.nap())}>
            Nap time
          </button>
          <i className={styles.sep} />
          <button type="button" role="menuitem" onClick={pick(togglePet)}>
            Hide Toothless
          </button>
        </div>
      )}
    </>
  );
}
