import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { applyScaleOrigin } from '../../utils/animationOrigin.js';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Window.module.css';

const MIN_WIDTH = 480;
const MIN_HEIGHT = 300;

export default function Window({ win }) {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    updateWindowPosition,
    updateWindowSize,
  } = useOS();

  const windowRef = useRef(null);
  const [scaleReady, setScaleReady] = useState(!win.opening);
  const isActive = activeWindowId === win.id;
  const Component = win.component;

  const syncOrigin = useCallback(() => {
    if (windowRef.current && win.animationOrigin) {
      applyScaleOrigin(windowRef.current, win.animationOrigin);
    }
  }, [win.animationOrigin]);

  useLayoutEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    if (win.animationOrigin) {
      applyScaleOrigin(el, win.animationOrigin);
    }

    if (win.opening) {
      setScaleReady(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setScaleReady(true));
      });
    }

    if (win.closing) {
      syncOrigin();
    }
  }, [win.opening, win.closing, win.animationOrigin, win.position, win.size, win.maximized, syncOrigin]);

  const setWindowRef = useCallback(
    (node) => {
      windowRef.current = node;
      if (node && win.animationOrigin) {
        applyScaleOrigin(node, win.animationOrigin);
      }
    },
    [win.animationOrigin]
  );

  const onTitleMouseDown = useCallback(
    (e) => {
      if (win.maximized || e.button !== 0) return;
      e.preventDefault();
      focusWindow(win.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const { x, y } = win.position;

      const onMove = (ev) => {
        updateWindowPosition(win.id, {
          x: Math.max(0, x + ev.clientX - startX),
          y: Math.max(24, y + ev.clientY - startY),
        });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [win, focusWindow, updateWindowPosition]
  );

  const onResizeMouseDown = useCallback(
    (direction) => (e) => {
      if (win.maximized || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(win.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const { x, y } = win.position;
      const { width, height } = win.size;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newX = x;
        let newY = y;
        let newW = width;
        let newH = height;

        if (direction.includes('e')) {
          newW = Math.max(MIN_WIDTH, width + dx);
        }
        if (direction.includes('w')) {
          const w = Math.max(MIN_WIDTH, width - dx);
          newX = x + (width - w);
          newW = w;
        }
        if (direction.includes('s')) {
          newH = Math.max(MIN_HEIGHT, height + dy);
        }
        if (direction.includes('n')) {
          const h = Math.max(MIN_HEIGHT, height - dy);
          newY = y + (height - h);
          newH = h;
        }

        updateWindowPosition(win.id, { x: Math.max(0, newX), y: Math.max(24, newY) });
        updateWindowSize(win.id, { width: newW, height: newH });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [win, focusWindow, updateWindowPosition, updateWindowSize]
  );

  const onClose = useCallback(
    (e) => {
      e.stopPropagation();
      syncOrigin();
      closeWindow(win.id);
    },
    [syncOrigin, win.id, closeWindow]
  );

  const style = win.maximized
    ? { zIndex: win.zIndex }
    : {
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
      };

  const resizeDirs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  const animClass = win.closing
    ? styles.windowClosing
    : win.minimizing
      ? styles.windowMinimizing
      : win.opening && scaleReady
        ? styles.windowOpening
        : win.opening
          ? styles.windowPreOpen
          : '';

  return (
    <div
      ref={setWindowRef}
      className={`${styles.window} ${win.maximized ? styles.windowMaximized : ''} ${isActive ? styles.focused : styles.unfocused} ${animClass}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
      role="dialog"
      aria-label={win.title}
    >
      <div className={styles.titlebar} data-window-titlebar onMouseDown={onTitleMouseDown}>
        <div className={styles.trafficLights}>
          <button
            type="button"
            className={`${styles.trafficBtn} ${styles.close}`}
            aria-label="Close"
            onClick={onClose}
          >
            <span className={styles.trafficSymbol} aria-hidden>
              ×
            </span>
          </button>
          <button
            type="button"
            className={`${styles.trafficBtn} ${styles.minimize}`}
            aria-label="Minimize"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
          >
            <span className={styles.trafficSymbol} aria-hidden>
              −
            </span>
          </button>
          <button
            type="button"
            className={`${styles.trafficBtn} ${styles.maximize}`}
            aria-label="Maximize"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize(win.id);
            }}
          >
            <span className={styles.trafficSymbol} aria-hidden>
              ⤢
            </span>
          </button>
        </div>
        <span className={styles.title}>{win.title}</span>
      </div>
      <div className={styles.content}>
        <Component windowId={win.id} data={win.data} isActive={isActive} />
      </div>
      {!win.maximized &&
        resizeDirs.map((dir) => (
          <div
            key={dir}
            className={`${styles.resizeHandle} ${styles[`resize${dir.toUpperCase()}`]}`}
            onMouseDown={onResizeMouseDown(dir)}
            aria-hidden
          />
        ))}
    </div>
  );
}
