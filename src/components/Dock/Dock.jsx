import { useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { useOS } from '../../context/OSContext.jsx';
import DockIcon from './DockIcon.jsx';
import styles from './Dock.module.css';

const DOCK_MAIN = [
  { id: 'finder', label: 'Work', appId: 'finder', src: '/assets/icons/desktop-web-ui.png', action: 'app' },
  { id: 'terminal', label: 'Terminal', appId: 'terminal', src: '/assets/icons/dock-terminal.png', action: 'app' },
  { id: 'illustrator', label: 'Illustrator', src: '/assets/icons/dock-Illustrator.png', action: 'none' },
  { id: 'aftereffects', label: 'After Effects', src: '/assets/icons/dock-after-effects.png', action: 'none' },
  {
    id: 'instagram',
    label: 'Instagram',
    src: '/assets/icons/dock-Instagram.png',
    action: 'url',
    url: 'https://instagram.com/nathanaelkenneth',
  },
  { id: 'claude', label: 'Claude', appId: 'claude', src: '/assets/icons/dock-claude-logo.png', action: 'app' },
  { id: 'resume', label: 'Resume', appId: 'pdfviewer', src: '/assets/icons/desktop-print.png', action: 'app' },
  {
    id: 'settings',
    label: 'Settings',
    appId: 'systempreferences',
    src: '/assets/icons/dock-settings.png',
    action: 'app',
  },
];

const DOCK_TRASH = {
  id: 'trash',
  label: 'Trash',
  appId: 'trash',
  src: '/assets/icons/dock-trash.png',
  action: 'app',
};

const SPRING = { stiffness: 300, damping: 30, mass: 0.1 };

function DockMagnifyItem({ mouseX, item, isRunning, onLaunch }) {
  const ref = useRef(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || val === Infinity) return 1000;
    return val - bounds.x - bounds.width / 2;
  });

  const scaleSync = useTransform(distance, [-150, -50, 0, 50, 150], [1, 1.3, 1.6, 1.3, 1]);
  const scale = useSpring(scaleSync, SPRING);

  return (
    <motion.div
      ref={ref}
      className={styles.item}
      style={{ scale, originY: 1 }}
    >
      <span className={styles.tooltip}>{item.label}</span>
      <button
        type="button"
        className={`${styles.itemBtn} ${item.action === 'none' ? styles.itemBtnDecorative : ''}`}
        onClick={onLaunch}
        aria-label={item.label}
        data-animation-origin
      >
        <DockIcon src={item.src} label={item.label} />
      </button>
      {isRunning && <span className={styles.running} aria-hidden />}
    </motion.div>
  );
}

export default function Dock() {
  const { windows, launchFromDock } = useOS();
  const mouseX = useMotionValue(Infinity);
  const runningApps = new Set(windows.map((w) => w.appId));

  const handleMouseMove = useCallback(
    (e) => {
      mouseX.set(e.clientX);
    },
    [mouseX]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
  }, [mouseX]);

  const handleLaunch = useCallback(
    (item, event) => {
      if (item.action === 'none') return;
      if (item.action === 'url' && item.url) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (item.appId) {
        launchFromDock(item.appId, { animationOrigin: getOriginFromEvent(event) });
      }
    },
    [launchFromDock]
  );

  return (
    <div className={styles.dockWrap}>
      <div
        className={styles.dock}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {DOCK_MAIN.map((item) => (
          <DockMagnifyItem
            key={item.id}
            mouseX={mouseX}
            item={item}
            isRunning={item.appId ? runningApps.has(item.appId) : false}
            onLaunch={(e) => handleLaunch(item, e)}
          />
        ))}
        <div className={styles.divider} aria-hidden />
        <DockMagnifyItem
          mouseX={mouseX}
          item={DOCK_TRASH}
          isRunning={runningApps.has(DOCK_TRASH.appId)}
          onLaunch={(e) => handleLaunch(DOCK_TRASH, e)}
        />
      </div>
    </div>
  );
}
