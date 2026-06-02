import { useCallback, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Dock.module.css';

const DOCK_APPS = [
  { appId: 'finder', label: 'Finder', icon: '📁' },
  { appId: 'about', label: 'About', icon: '👤' },
  { appId: 'experience', label: 'Experience', icon: '💼' },
  { appId: 'terminal', label: 'Terminal', icon: '⌨️' },
  { appId: 'minesweeper', label: 'Minesweeper', icon: '💣' },
  { appId: 'contact', label: 'Contact', icon: '✉️' },
  { appId: 'pdfviewer', label: 'CV', icon: '📄' },
  { appId: 'systempreferences', label: 'Settings', icon: '⚙️' },
  { appId: 'trash', label: 'Trash', icon: '🗑️' },
];

const BASE_SIZE = 44;
const MAX_SCALE = 1.55;

export default function Dock() {
  const { windows, launchFromDock } = useOS();
  const dockRef = useRef(null);
  const [magnifyIndex, setMagnifyIndex] = useState(null);

  const runningApps = new Set(windows.map((w) => w.appId));

  const getScale = useCallback(
    (index) => {
      if (magnifyIndex === null) return 1;
      const dist = Math.abs(index - magnifyIndex);
      if (dist === 0) return MAX_SCALE;
      if (dist === 1) return 1.25;
      if (dist === 2) return 1.1;
      return 1;
    },
    [magnifyIndex]
  );

  const handleMouseMove = useCallback((e) => {
    const dock = dockRef.current;
    if (!dock) return;
    const items = dock.querySelectorAll('[data-dock-index]');
    let closest = null;
    let minDist = Infinity;
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(e.clientX - center);
      if (dist < minDist) {
        minDist = dist;
        closest = Number(el.dataset.dockIndex);
      }
    });
    setMagnifyIndex(minDist < 80 ? closest : null);
  }, []);

  return (
    <div className={styles.dockWrap}>
      <div
        ref={dockRef}
        className={styles.dock}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMagnifyIndex(null)}
      >
        {DOCK_APPS.slice(0, 7).map((app, i) => (
          <DockItem
            key={app.appId}
            app={app}
            index={i}
            scale={getScale(i)}
            isRunning={runningApps.has(app.appId)}
            onLaunch={() => launchFromDock(app.appId)}
          />
        ))}
        <div className={styles.divider} aria-hidden />
        {DOCK_APPS.slice(7).map((app, i) => {
          const index = i + 7;
          return (
            <DockItem
              key={app.appId}
              app={app}
              index={index}
              scale={getScale(index)}
              isRunning={runningApps.has(app.appId)}
              onLaunch={() => launchFromDock(app.appId)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DockItem({ app, index, scale, isRunning, onLaunch }) {
  const size = BASE_SIZE * scale;

  return (
    <div
      className={styles.item}
      data-dock-index={index}
      style={{ transform: `scale(${scale})` }}
    >
      <span className={styles.tooltip}>{app.label}</span>
      <button
        type="button"
        className={styles.itemBtn}
        onClick={onLaunch}
        aria-label={app.label}
      >
        <span
          className={styles.icon}
          style={{ width: size, height: size, fontSize: size * 0.5 }}
        >
          {app.icon}
        </span>
      </button>
      {isRunning && <span className={styles.running} aria-hidden />}
    </div>
  );
}
