import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { PORTFOLIO_ICON_SRC } from '../../data/funZone.jsx';
import { useOS } from '../../context/OSContext.jsx';
import { useSystemSettings } from '../../hooks/useSystemSettings.js';
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
    appId: 'illustrator',
    action: 'splash',
    splashId: 'illustrator',
    customIcon: 'illustrator',
  },
  {
    id: 'photoshop',
    label: 'Photoshop',
    appId: 'photoshop',
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

function DockMagnifyItem({ mouseX, item, isRunning, onLaunch, onMenu, showPulse, showNudge, magnify = true }) {
  const ref = useRef(null);
  const hold = useRef(0);
  const held = useRef(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || val === Infinity) return 1000;
    return val - bounds.x - bounds.width / 2;
  });

  // Animate real box size (not just a visual scale transform) so the flex
  // layout actually reflows and neighboring icons are pushed apart , 
  // matching real macOS dock magnification instead of overlapping in place.
  const sizeSync = useTransform(
    distance,
    [-140, -70, 0, 70, 140],
    magnify ? [BASE_SIZE, NEIGHBOR_SIZE, MAX_SIZE, NEIGHBOR_SIZE, BASE_SIZE] : [BASE_SIZE, BASE_SIZE, BASE_SIZE, BASE_SIZE, BASE_SIZE]
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
        onClick={(e) => {
          if (held.current) {
            held.current = false;
            return;
          }
          onLaunch(e);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onMenu(e);
        }}
        // Click and hold: the menu, as on the Mac.
        onPointerDown={(e) => {
          const target = e.currentTarget;
          clearTimeout(hold.current);
          hold.current = setTimeout(() => {
            held.current = true;
            onMenu({ currentTarget: target });
          }, 550);
        }}
        onPointerUp={() => clearTimeout(hold.current)}
        onPointerLeave={() => clearTimeout(hold.current)}
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
  const { windows, launchFromDock, launchApp, closeWindow, minimizeWindow, focusWindow, portfolioPulseActive, showEasterEggNudge } = useOS();
  const [activeSplash, setActiveSplash] = useState(null);
  const sys = useSystemSettings();
  // The right-click (or long-press) menu over an icon, as on the Mac.
  const [menu, setMenu] = useState(null);
  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);
  const openMenu = (item, e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ item, x: r.left + r.width / 2, y: r.top - 10 });
  };
  const menuItems = (item) => {
    const wins = windows.filter((w) => w.appId === item.appId);
    const running = wins.length > 0;
    const run = (fn) => () => {
      setMenu(null);
      fn();
    };
    const list = [];
    if (item.appId === 'finder' || item.appId === 'pdfviewer') list.push(['Show in Finder', run(() => launchFromDock('finder'))]);
    if (list.length) list.push(null);
    if (running) {
      list.push([`Show All Windows`, run(() => wins.forEach((w) => focusWindow(w.id)))]);
      list.push(['Hide', run(() => wins.forEach((w) => minimizeWindow(w.id)))]);
      list.push(null);
      list.push(['Quit', run(() => wins.forEach((w) => closeWindow(w.id)))]);
      list.push(['Force Quit', run(() => wins.forEach((w) => closeWindow(w.id)))]);
    } else {
      list.push(['Open', run(() => handleLaunch(item))]);
    }
    list.push(null);
    list.push(['Get Info', run(() => launchApp('getinfo', { title: `${item.label} Info`, data: { id: item.appId ?? item.id, label: item.label, src: item.src } }))]);
    return list;
  };
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
        // Already open: straight to it. Otherwise the splash, then the app.
        const src = SPLASH_SCREENS[item.splashId];
        if (src && !windows.some((w) => w.appId === item.appId)) setActiveSplash({ label: item.label, imageSrc: src, appId: item.appId });
        else launchFromDock(item.appId);
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
    [launchFromDock, windows]
  );

  const renderItem = (item) => (
    <DockMagnifyItem
      key={item.id}
      mouseX={mouseX}
      item={item}
      isRunning={item.appId ? runningApps.has(item.appId) : false}
      onLaunch={(e) => handleLaunch(item, e)}
      onMenu={(e) => openMenu(item, e)}
      magnify={sys.dockMagnify}
      showPulse={Boolean(item.pulse && portfolioPulseActive)}
      showNudge={Boolean(item.nudge && showEasterEggNudge)}
    />
  );

  return (
    <>
      <div className={styles.dockWrap}>
        <div className={styles.dock} data-cat-surface onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          {DOCK_PRIMARY.map(renderItem)}
          <div className={styles.divider} aria-hidden />
          {DOCK_SECONDARY.map(renderItem)}
          <div className={styles.divider} aria-hidden />
          {renderItem(DOCK_TRASH)}
        </div>
      </div>
      {menu && (
        <div className={styles.menu} style={{ left: menu.x, top: menu.y }} role="menu" onPointerDown={(e) => e.stopPropagation()}>
          <span className={styles.menuTitle}>{menu.item.label}</span>
          {menuItems(menu.item).map((m, i) =>
            m ? (
              <button key={m[0]} type="button" role="menuitem" onClick={m[1]}>
                {m[0]}
              </button>
            ) : (
              <i key={`s${i}`} className={styles.menuSep} />
            )
          )}
        </div>
      )}
      {activeSplash && (
        <AdobeSplashOverlay
          label={activeSplash.label}
          imageSrc={activeSplash.imageSrc}
          onClose={() => setActiveSplash(null)}
          onOpen={() => {
            launchFromDock(activeSplash.appId);
            setActiveSplash(null);
          }}
        />
      )}
    </>
  );
}
