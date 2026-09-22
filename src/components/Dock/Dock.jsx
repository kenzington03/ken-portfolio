import { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { PORTFOLIO_ICON_SRC } from '../../data/funZone.jsx';
import { useOS } from '../../context/OSContext.jsx';
import DockIcon from './DockIcon.jsx';
import IllustratorIcon from './IllustratorIcon.jsx';
import PhotoshopIcon from './PhotoshopIcon.jsx';
import AdobeSplashOverlay from './AdobeSplashOverlay.jsx';
import styles from './Dock.module.css';

const NUDGE_TEXT = "Explore more after you've seen the work 👀";

const SPLASH_SCREENS = {
  illustrator: '/assets/splash-screens/illustrator-splashscreen.png',
  photoshop: '/assets/splash-screens/photoshop-splashscreen.png',
};

const DOCK_PRIMARY = [
  {
    id: 'finder',
    label: 'Portfolio',
    appId: 'finder',
    src: PORTFOLIO_ICON_SRC,
    action: 'app',
    pulse: true,
    tourId: 'dock-portfolio',
  },
  {
    id: 'about',
    label: 'About',
    appId: 'about',
    src: '/assets/icons/desktop-Resume.png',
    action: 'app',
  },
  {
    id: 'contact',
    label: 'Contact',
    appId: 'contact',
    src: '/assets/icons/dock-contacts.png',
    action: 'app',
  },
];

const DOCK_SECONDARY = [
  {
    id: 'illustrator',
    label: 'Illustrator',
    action: 'splash',
    splashId: 'illustrator',
    customIcon: 'illustrator',
  },
  {
    id: 'photoshop',
    label: 'Photoshop',
    action: 'splash',
    splashId: 'photoshop',
    customIcon: 'photoshop',
  },
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

const BASE_SIZE = 48;
const MAX_SIZE = 76;
const NEIGHBOR_SIZE = 58;

function DockMagnifyItem({ mouseX, item, isRunning, onLaunch, showPulse, showNudge }) {
  const ref = useRef(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || val === Infinity) return 1000;
    return val - bounds.x - bounds.width / 2;
  });

  // Animate real box size (not just a visual scale transform) so the flex
  // layout actually reflows and neighboring icons are pushed apart —
  // matching real macOS dock magnification instead of overlapping in place.
  const sizeSync = useTransform(
    distance,
    [-140, -70, 0, 70, 140],
    [BASE_SIZE, NEIGHBOR_SIZE, MAX_SIZE, NEIGHBOR_SIZE, BASE_SIZE]
  );
  const size = useSpring(sizeSync, SPRING);
  const radius = useTransform(size, [BASE_SIZE, MAX_SIZE], [12, 18]);

  const renderIcon = () => {
    if (item.customIcon === 'illustrator') return <IllustratorIcon />;
    if (item.customIcon === 'photoshop') return <PhotoshopIcon />;
    return <DockIcon src={item.src} label={item.label} />;
  };

  return (
    <div ref={ref} className={styles.item}>
      {showNudge && <span className={styles.nudgeTooltip}>{NUDGE_TEXT}</span>}
      <motion.button
        type="button"
        className={`${styles.itemBtn} ${showPulse ? styles.pulse : ''}`}
        style={{ width: size, height: size, borderRadius: radius }}
        onClick={onLaunch}
        aria-label={item.label}
        data-animation-origin
        data-tour={item.tourId}
      >
        {renderIcon()}
      </motion.button>
      <span className={styles.label} aria-hidden>{item.label}</span>
      {isRunning && <span className={styles.running} aria-hidden />}
    </div>
  );
}

export default function Dock() {
  const { windows, launchFromDock, portfolioPulseActive, showEasterEggNudge } = useOS();
  const [activeSplash, setActiveSplash] = useState(null);
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
      if (item.action === 'splash') {
        const src = SPLASH_SCREENS[item.splashId];
        if (src) {
          setActiveSplash({ label: item.label, imageSrc: src });
        }
        return;
      }
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

  const renderItem = (item) => (
    <DockMagnifyItem
      key={item.id}
      mouseX={mouseX}
      item={item}
      isRunning={item.appId ? runningApps.has(item.appId) : false}
      onLaunch={(e) => handleLaunch(item, e)}
      showPulse={Boolean(item.pulse && portfolioPulseActive)}
      showNudge={Boolean(item.nudge && showEasterEggNudge)}
    />
  );

  return (
    <>
      <div className={styles.dockWrap}>
        <div className={styles.dock} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <div className="glassDistort" aria-hidden />
          <div className={`glassTint ${styles.dockTint}`} aria-hidden />
          <div className="glassShine" aria-hidden />
          <div className={styles.dockContent}>
            {DOCK_PRIMARY.map(renderItem)}
            <div className={styles.divider} aria-hidden />
            {DOCK_SECONDARY.map(renderItem)}
            <div className={styles.divider} aria-hidden />
            {renderItem(DOCK_TRASH)}
          </div>
        </div>
      </div>
      {activeSplash && (
        <AdobeSplashOverlay
          label={activeSplash.label}
          imageSrc={activeSplash.imageSrc}
          onClose={() => setActiveSplash(null)}
        />
      )}
    </>
  );
}
