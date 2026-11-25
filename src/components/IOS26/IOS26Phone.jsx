import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './tokens.css';
import LockScreen from './LockScreen.jsx';
import HomeScreen from './HomeScreen.jsx';
import FolderOverlay from './FolderOverlay.jsx';
import ControlCenter from './ControlCenter.jsx';
import AppSheet from '../IPhoneHome/AppSheet.jsx';
import { BOOKING_URL, ICON, TEL } from './apps.js';
import { CUSTOM_BG } from './icons.jsx';
import { track } from '../../utils/track.js';
import styles from './ios26.module.css';

const A = '/assets/ios26/chrome';
const W = 402; // the kit's logical screen width
const H = 874; // and height, on the iPhone 17 Pro

/* One iPhone, built on the Figma kit's 402×874 canvas.

   framed  draws the iPhone 17 Pro bezel and scales it to fit its container
           (the lab; tablets).
   !framed fills the viewport edge to edge, as the OS does on a real phone: the
           same canvas, scaled to the screen's width, as tall as the screen is.
   scaleOverride + inert  a still, non-interactive copy at a fixed scale
           (the journey's ending zooms into one).

   screen: 'lock' | 'lock-notifs' | 'home' (controlled by the parent). The
   rest (open app, open folder, Control Center) lives inside. */
export default function IOS26Phone({
  theme = 'dark',
  onThemeChange,
  framed = true,
  screen = 'lock',
  onScreenChange,
  time,
  kit = false,
  fitHeight,
  across = 1,
  scaleOverride,
  inert = false,
  autoNotifs = false,
}) {
  /* ───── size ───── */
  const [fit, setFit] = useState(1);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const wrap = useRef(null);
  const screenRef = useRef(null);

  useLayoutEffect(() => {
    const on = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight });
      if (!framed || scaleOverride != null) return;
      // Fit to the room left below wherever this phone starts (header, toolbar),
      // so the home indicator is always on screen without scrolling.
      const top = wrap.current ? wrap.current.getBoundingClientRect().top + window.scrollY : 0;
      const h = fitHeight ?? window.innerHeight - top - 12;
      // 48 = the lab's 20px side padding twice, plus slack; 24 = gap between phones.
      const w = (window.innerWidth - 48 - (across - 1) * 24) / across;
      setFit(Math.min(1, h / 920, w / 450));
    };
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [framed, fitHeight, across, scaleOverride]);

  const scale = framed ? (scaleOverride ?? fit) : vp.w / W; // screen px per canvas px
  const canvasH = framed ? H : vp.h / scale;

  /* ───── state ───── */
  const [dragY, setDragY] = useState(0);
  const [ccOpen, setCcOpen] = useState(false);
  const [folderKey, setFolderKey] = useState(null);
  const [activeApp, setActiveApp] = useState(null);
  const [brightness, setBrightness] = useState(1);
  const [notifReady, setNotifReady] = useState(false);
  const unlocked = screen === 'home';
  const dark = theme === 'dark';

  // The notifications arrive a moment after the lock screen does.
  useEffect(() => {
    if (!autoNotifs || screen !== 'lock') {
      setNotifReady(false);
      return undefined;
    }
    const id = setTimeout(() => setNotifReady(true), 1600);
    return () => clearTimeout(id);
  }, [autoNotifs, screen]);
  const showNotifs = screen === 'lock-notifs' || (autoNotifs && screen === 'lock' && notifReady);

  /* ───── opening things ───── */
  const rectOf = useCallback(
    (el) => {
      const root = screenRef.current;
      if (!el || !root) return null;
      const r = el.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      const left = (r.left - o.left) / scale;
      const top = (r.top - o.top) / scale;
      return { left, top, right: left + r.width / scale, bottom: top + r.height / scale, width: r.width / scale, height: r.height / scale, vw: W, vh: canvasH };
    },
    [scale, canvasH],
  );

  const open = useCallback(
    (app, el) => {
      if (app.folder) {
        setFolderKey(app.folder);
        return;
      }
      if (app.action === 'book') {
        track('phone_book_call', {});
        window.open(BOOKING_URL, '_blank', 'noopener');
        return;
      }
      if (app.action === 'tel') {
        window.location.href = TEL;
        return;
      }
      if (!app.appKey) return;
      track('phone_open_app', { app: app.appKey });
      setFolderKey(null);
      setActiveApp({
        ...app,
        rect: rectOf(el),
        // the tile that grows into the app
        imgSrc: app.icon ? ICON(app.icon) : app.imgSrc,
        style: app.custom ? CUSTOM_BG[app.custom] : app.style || '#fff',
      });
    },
    [rectOf],
  );

  const fromNotification = (n) => {
    if (screen !== 'home') onScreenChange?.('home');
    setTimeout(() => open(n, null), 250);
  };

  /* ───── gestures: swipe up to unlock, swipe down from the top right for
     Control Center. Tracked on the whole screen so they also start on the
     home indicator. ───── */
  const start = useRef(null);
  const swipedAt = useRef(0);
  const busy = ccOpen || folderKey || activeApp;

  const onDown = (e) => {
    if (inert || busy) return;
    const o = screenRef.current.getBoundingClientRect();
    const lx = (e.clientX - o.left) / scale;
    const ly = (e.clientY - o.top) / scale;
    if (ly < 70 && lx > W * 0.5) start.current = { mode: 'cc', y: e.clientY, moved: false };
    else if (screen !== 'home') start.current = { mode: 'unlock', y: e.clientY, moved: false };
  };
  const onMove = (e) => {
    const s = start.current;
    if (!s) return;
    const dy = (e.clientY - s.y) / scale;
    if (s.mode === 'cc') {
      if (dy > 36) {
        s.moved = true;
        start.current = null;
        swipedAt.current = performance.now();
        setCcOpen(true);
      }
      return;
    }
    if (dy < -6 && !s.moved) {
      // Only now is it a swipe: capture, so taps on buttons/notifications still work.
      s.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (s.moved) setDragY(Math.min(0, dy));
  };
  const onUp = () => {
    const s = start.current;
    start.current = null;
    // A mouse swipe ends with a click on whatever is under the pointer. Remember
    // that a swipe just happened so the home indicator doesn't read it as a tap.
    if (s?.moved) swipedAt.current = performance.now();
    const go = s && s.mode === 'unlock' && dragY < -120;
    setDragY(0);
    if (go) onScreenChange?.('home');
  };
  const onIndicatorTap = () => {
    if (performance.now() - swipedAt.current < 500) return;
    if (activeApp || folderKey || ccOpen) return;
    if (unlocked) onScreenChange?.('lock');
  };

  /* ───── screen ───── */
  const body = (
    <div
      ref={screenRef}
      className={styles.screen}
      style={{ pointerEvents: inert ? 'none' : undefined, borderRadius: framed ? undefined : 0 }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img className={`${styles.wallpaper} ${dark ? styles.wallpaperDark : ''}`} src={`${A}/wallpaper.jpg`} alt="" draggable={false} />
      <HomeScreen locked={!unlocked} reveal={Math.min(1, Math.max(0, -dragY / 320))} time={kit ? '9:41' : time} onOpen={open} onStatusTap={() => setCcOpen(true)} />
      <LockScreen
        kit={kit}
        time={time}
        showNotifications={showNotifs}
        dark={dark}
        unlocked={unlocked}
        dragY={dragY}
        onNotifTap={fromNotification}
        onStatusTap={() => setCcOpen(true)}
      />

      {/* screen brightness (Control Center), under every overlay */}
      <div className={styles.dim} style={{ opacity: (1 - brightness) * 0.6 }} />

      <FolderOverlay folderKey={folderKey} onClose={() => setFolderKey(null)} onOpenApp={open} />
      <ControlCenter
        open={ccOpen}
        onClose={() => setCcOpen(false)}
        theme={theme}
        onTheme={(t) => onThemeChange?.(t)}
        brightness={brightness}
        onBrightness={setBrightness}
        onOpenApp={(a) => {
          setCcOpen(false);
          open(a, null);
        }}
      />
      <AppSheet app={activeApp} onClose={() => setActiveApp(null)} />

      <div
        className={styles.homeIndicator}
        onClick={onIndicatorTap}
        role="button"
        aria-label={unlocked ? 'Lock' : 'Home indicator'}
      />
    </div>
  );

  if (!framed) {
    return (
      <div className="ios26" data-theme={theme} style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'relative', width: W, height: canvasH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{body}</div>
      </div>
    );
  }
  return (
    <div className="ios26" data-theme={theme}>
      <div ref={wrap} style={{ width: 450 * scale, height: 920 * scale }}>
        <div className={styles.stage} style={{ transform: `scale(${scale})` }}>
          <div className={styles.deviceBox}>{body}</div>
          <img className={styles.bezel} src={`${A}/bezel-17pro-silver.png`} alt="" draggable={false} />
        </div>
      </div>
    </div>
  );
}
