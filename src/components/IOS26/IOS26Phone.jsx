import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './tokens.css';
import LockScreen from './LockScreen.jsx';
import HomeScreen from './HomeScreen.jsx';
import FolderOverlay from './FolderOverlay.jsx';
import ControlCenter from './ControlCenter.jsx';
import NavBar from './NavBar.jsx';
import Tutorial from './Tutorial.jsx';
import AppSheet from '../IPhoneHome/AppSheet.jsx';
import { BOOKING_URL, ICON, TEL } from './apps.js';
import { CUSTOM_BG } from './icons.jsx';
import { PhoneContext } from './PhoneContext.js';
import { deviceFit, ROOM } from './geometry.js';
import { track } from '../../utils/track.js';
import styles from './ios26.module.css';

const A = '/assets/ios26/chrome';
const W = 402; // the kit's logical screen width
const H = 874; // and height, on the iPhone 17 Pro
const TUTORIAL_KEY = 'ken-phone-tutorial';

const tutorialSeen = () => {
  try {
    return window.localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return true; // can't remember: don't nag
  }
};

/* One iPhone, built on the Figma kit's 402×874 canvas.

   device  the phone on a visitor's phone: the whole bezel and Dynamic Island,
           fitted to the screen with a Home / Back / Help bar under it (a
           browser keeps its own swipes, so the phone needs buttons).
   framed  the bezel, scaled to fit its container (the lab; tablets).
   scaleOverride + inert  a still, non-interactive copy at a fixed scale
           (the journey's ending slides one up).

   screen: 'lock' | 'lock-notifs' | 'home' (controlled by the parent). The
   rest (open app, open folder, Control Center, tutorial) lives inside, and is
   wired into the browser's history so Back closes the thing you are in. */
export default function IOS26Phone({
  theme = 'dark',
  onThemeChange,
  framed = true,
  device = false,
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
      if (device || !framed || scaleOverride != null) return;
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
  }, [device, framed, fitHeight, across, scaleOverride]);

  const g = useMemo(() => deviceFit(vp.w, vp.h), [vp]);
  const scale = device ? g.k : framed ? (scaleOverride ?? fit) : vp.w / W; // screen px per canvas px
  const canvasH = framed || device ? H : vp.h / scale;

  /* ───── state ───── */
  const [dragY, setDragY] = useState(0);
  const [ccOpen, setCcOpen] = useState(false);
  const [folderKey, setFolderKey] = useState(null);
  const [activeApp, setActiveApp] = useState(null);
  const [appClose, setAppClose] = useState(0);
  const [tutorial, setTutorial] = useState(false);
  const [depth, setDepth] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [notifReady, setNotifReady] = useState(false);
  const pagerRef = useRef(null);
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

  // The first time the home screen shows, say how this phone works.
  useEffect(() => {
    if (!device || screen !== 'home' || tutorialSeen()) return undefined;
    const id = setTimeout(() => setTutorial(true), 900);
    return () => clearTimeout(id);
  }, [device, screen]);
  const closeTutorial = () => {
    setTutorial(false);
    try {
      window.localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      /* private mode */
    }
  };

  /* ───── the browser's Back ─────
     Each thing opened (a folder, an app, Control Center) takes a history
     entry, so the browser's Back (or an edge swipe) closes it, one step at a
     time. Closing from the phone's own UI pops that entry, so the two never
     disagree. */
  const stack = useRef([]);
  const ignorePop = useRef(0);
  const sync = () => setDepth(stack.current.length);
  const push = useCallback((kind) => {
    stack.current.push(kind);
    try {
      window.history.pushState({ ios: kind }, '');
    } catch {
      /* sandboxed frame: no history, no Back */
    }
    sync();
  }, []);
  const replaceTop = useCallback((kind) => {
    stack.current[stack.current.length - 1] = kind;
    try {
      window.history.replaceState({ ios: kind }, '');
    } catch {
      /* sandboxed frame */
    }
  }, []);
  const popEntry = useCallback(() => {
    if (!stack.current.length) return;
    stack.current.pop();
    ignorePop.current += 1;
    try {
      window.history.back();
    } catch {
      ignorePop.current -= 1;
    }
    sync();
  }, []);
  const closeKind = useCallback((kind) => {
    if (kind === 'cc') setCcOpen(false);
    else if (kind === 'folder') setFolderKey(null);
    else if (kind === 'app') setAppClose((n) => n + 1);
  }, []);

  useEffect(() => {
    if (inert) return undefined;
    const on = () => {
      if (ignorePop.current > 0) {
        ignorePop.current -= 1;
        return;
      }
      const kind = stack.current.pop();
      sync();
      if (kind) closeKind(kind);
    };
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, [inert, closeKind]);

  const top = () => stack.current[stack.current.length - 1];

  /* ───── opening things ───── */
  const rectOf = useCallback(
    (el) => {
      const root = screenRef.current;
      if (!el || !root) return null;
      const r = el.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      const left = (r.left - o.left) / scale;
      const t = (r.top - o.top) / scale;
      return { left, top: t, right: left + r.width / scale, bottom: t + r.height / scale, width: r.width / scale, height: r.height / scale, vw: W, vh: canvasH };
    },
    [scale, canvasH],
  );

  const openFolder = (key) => {
    setFolderKey(key);
    push('folder');
  };
  const openCc = () => {
    if (ccOpen) return;
    setCcOpen(true);
    push('cc');
  };
  const closeCc = () => {
    setCcOpen(false);
    if (top() === 'cc') popEntry();
  };
  const closeFolder = () => {
    setFolderKey(null);
    if (top() === 'folder') popEntry();
  };

  const open = useCallback(
    (app, el) => {
      if (app.folder) {
        openFolder(app.folder);
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
      // The folder (or Control Center) it was opened from turns into the app's entry.
      if (top() === 'folder' || top() === 'cc') {
        setFolderKey(null);
        setCcOpen(false);
        replaceTop('app');
      } else if (top() !== 'app') {
        push('app');
      }
      setActiveApp({
        ...app,
        rect: rectOf(el),
        // the tile that grows into the app
        imgSrc: app.icon ? ICON(app.icon) : app.imgSrc,
        style: app.custom ? CUSTOM_BG[app.custom] : app.style || '#fff',
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rectOf, push, replaceTop],
  );

  const appClosed = () => {
    setActiveApp(null);
    if (top() === 'app') popEntry();
  };

  const fromNotification = (n) => {
    if (screen !== 'home') onScreenChange?.('home');
    setTimeout(() => open(n, null), 250);
  };

  /* ───── Home / Back / Help ───── */
  const goHome = () => {
    if (tutorial) closeTutorial();
    if (screen !== 'home') {
      onScreenChange?.('home');
      return;
    }
    const n = stack.current.length;
    if (n) {
      stack.current = [];
      sync();
      ignorePop.current += 1;
      try {
        window.history.go(-n);
      } catch {
        ignorePop.current -= 1;
      }
      setCcOpen(false);
      setFolderKey(null);
      if (activeApp) setAppClose((c) => c + 1);
    }
    pagerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };
  const goBack = () => {
    if (tutorial) {
      closeTutorial();
      return;
    }
    if (stack.current.length) window.history.back();
  };

  /* ───── gestures: swipe up to unlock, swipe down from the top right for
     Control Center. Tracked on the whole screen so they also start on the
     home indicator. ───── */
  const start = useRef(null);
  const swipedAt = useRef(0);
  const busy = ccOpen || folderKey || activeApp || tutorial;

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
        openCc();
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
    if (activeApp) {
      setAppClose((n) => n + 1);
      return;
    }
    if (folderKey) {
      closeFolder();
      return;
    }
    if (ccOpen) {
      closeCc();
      return;
    }
    if (unlocked) onScreenChange?.('lock');
  };

  const ctx = useMemo(
    () => ({ theme, setTheme: (t) => onThemeChange?.(t), openApp: (a) => open(a, null), close: () => setAppClose((n) => n + 1), showTutorial: () => setTutorial(true) }),
    [theme, onThemeChange, open],
  );

  /* ───── screen ───── */
  const body = (
    <div
      ref={screenRef}
      className={styles.screen}
      style={{ pointerEvents: inert ? 'none' : undefined, borderRadius: framed || device ? undefined : 0 }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img className={`${styles.wallpaper} ${dark ? styles.wallpaperDark : ''}`} src={`${A}/wallpaper.jpg`} alt="" draggable={false} />
      <HomeScreen
        locked={!unlocked}
        under={ccOpen || !!folderKey || tutorial}
        reveal={Math.min(1, Math.max(0, -dragY / 320))}
        time={kit ? '9:41' : time}
        onOpen={open}
        onStatusTap={openCc}
        pagerRef={pagerRef}
        scale={scale}
      />
      <LockScreen
        kit={kit}
        time={time}
        showNotifications={showNotifs}
        dark={dark}
        unlocked={unlocked}
        dragY={dragY}
        under={ccOpen || tutorial}
        onNotifTap={fromNotification}
        onStatusTap={openCc}
      />

      {/* screen brightness (Control Center), under every overlay */}
      <div className={styles.dim} style={{ opacity: (1 - brightness) * 0.6 }} />

      <PhoneContext.Provider value={ctx}>
        <FolderOverlay folderKey={folderKey} onClose={closeFolder} onOpenApp={open} />
        <ControlCenter
          open={ccOpen}
          onClose={closeCc}
          theme={theme}
          onTheme={(t) => onThemeChange?.(t)}
          brightness={brightness}
          onBrightness={setBrightness}
          onOpenApp={(a) => open(a, null)}
        />
        <AppSheet app={activeApp} onClose={appClosed} closeRequest={appClose} />
        <Tutorial open={tutorial} onClose={closeTutorial} />
      </PhoneContext.Provider>

      <div className={styles.homeIndicator} onClick={onIndicatorTap} role="button" aria-label={unlocked ? 'Lock' : 'Home indicator'} />
    </div>
  );

  const stage = (
    <div className={styles.stage} style={{ transform: `scale(${scale})` }}>
      <div className={styles.deviceBox}>{body}</div>
      <img className={styles.bezel} src={`${A}/bezel-17pro-silver.png`} alt="" draggable={false} />
    </div>
  );

  if (device) {
    return (
      <div className="ios26" data-theme={theme} style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: ROOM, touchAction: 'none' }}>
        {/* The shadow is its own box, never a `filter` on the phone: in Safari a
            filtered ancestor switches off every backdrop-filter inside it (all the
            glass). */}
        <div aria-hidden style={{ position: 'absolute', left: g.left + g.w * 0.03, top: g.top + g.h * 0.02, width: g.w * 0.94, height: g.h * 0.96, borderRadius: g.w * 0.13, boxShadow: '0 30px 50px rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', left: g.left, top: g.top, width: g.w, height: g.h }}>{stage}</div>
        <NavBar onHome={goHome} onBack={goBack} onHelp={() => setTutorial(true)} canBack={depth > 0 || tutorial} />
      </div>
    );
  }
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
        {stage}
      </div>
    </div>
  );
}
