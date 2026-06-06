import { useCallback, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Dock.module.css';

const DOCK_APPS = [
  { appId: 'finder', label: 'Finder', icon: '/assets/icons/desktop-web-ui.png' },
  { appId: 'about', label: 'About', icon: '/assets/icons/desktop-Resume.png' },
  { appId: 'experience', label: 'Experience', icon: '/assets/icons/desktop-milestone.png' },
  { appId: 'terminal', label: 'Terminal', icon: '/assets/icons/dock-after-effects.png' },
  { appId: 'minesweeper', label: 'Minesweeper', icon: '/assets/icons/desktop-fluidai.png' },
  { appId: 'contact', label: 'Contact', icon: '/assets/icons/dock-mail.png' },
  { appId: 'pdfviewer', label: 'CV', icon: '/assets/icons/desktop-Resume.png' },
  { appId: 'systempreferences', label: 'Settings', icon: '/assets/icons/desktop-milestone.png' },
  { appId: 'trash', label: 'Trash', icon: '/assets/icons/dock-trash.png' },
];

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
        <img
          src={app.icon}
          alt=""
          className={styles.icon}
          width={48}
          height={48}
          draggable={false}
        />
      </button>
      {isRunning && <span className={styles.running} aria-hidden />}
    </div>
  );
}
