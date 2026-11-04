import { useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { createCat } from './catEngine.js';
import styles from './ToothlessCat.module.css';

// Toothless, the desktop cat (after the desktop pets of the early 2000s, like
// MyFelix). He is drawn and moved by catEngine.js; this places his canvas,
// the invisible handle you pick him up by, his speech and his menu.
export default function ToothlessCat() {
  const { petVisible, togglePet } = useOS();
  const canvasRef = useRef(null);
  const hitRef = useRef(null);
  const engine = useRef(null);
  const [say, setSay] = useState('');
  const [menu, setMenu] = useState(null);
  const [laser, setLaser] = useState(false);
  const sayTimer = useRef(0);

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
        role="button"
        tabIndex={0}
        aria-label="Toothless, the desktop cat. Click to stroke him, drag to pick him up and throw him, right-click for more."
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          engine.current?.grab(e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: Math.min(e.clientX, window.innerWidth - 220), y: Math.max(40, e.clientY - 200) });
        }}
        onKeyDown={(e) => e.key === 'Enter' && engine.current?.stroke()}
      >
        {say && <span className={styles.say}>{say}</span>}
      </div>
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
