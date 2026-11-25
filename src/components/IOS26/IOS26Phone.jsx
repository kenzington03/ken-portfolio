import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './tokens.css';
import LockScreen from './LockScreen.jsx';
import HomeScreen from './HomeScreen.jsx';
import FolderOverlay from './FolderOverlay.jsx';
import ControlCenter from './ControlCenter.jsx';
import Switcher from './Switcher.jsx';
import Search from './Search.jsx';
import Toast from './Toast.jsx';
import Tutorial from './Tutorial.jsx';
import AppSheet from '../IPhoneHome/AppSheet.jsx';
import { BOOKING_URL, ICON, TEL } from './apps.js';
import { CUSTOM_BG, Glyph } from './icons.jsx';
import { PhoneContext } from './PhoneContext.js';
import { deviceFit, ROOM } from './geometry.js';
import { savedWallpaper, saveWallpaper, wallpaperSrc } from './wallpapers.js';
import { track } from '../../utils/track.js';
import styles from './ios26.module.css';
import ov from './overlays.module.css';

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
const isStandalone = () => {
  try {
    return !!window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
};
/** What an app card in the switcher needs to draw its icon. */
const recentOf = (a) => ({ id: a.id, label: a.label, appKey: a.appKey, icon: a.icon, custom: a.custom, live: a.live, cover: a.cover, imgSrc: a.imgSrc, style: a.style, glyph: a.glyph });

/* One iPhone, built on the Figma kit's 402×874 canvas.

   device  the phone on a visitor's phone: the whole bezel and Dynamic Island,
           as big as the screen allows. There is no button bar: it is moved
           like an iPhone (below).
   framed  the bezel, scaled to fit its container (the lab; tablets).
   scaleOverride + inert  a still, non-interactive copy at a fixed scale
           (the journey's ending slides one up).

   Gestures, all from invisible strips at the screen's edges (a scrolling page
   would otherwise swallow them):
     bottom edge, swipe up    unlock / go home; in an app: flick = home,
                              pull and hold = the app switcher
     left edge, swipe right   back (closes the app / folder / Control Center)
     top right, pull down     Control Center
     home screen, pull down   Search
   and the browser's own Back does the same, because every layer opened takes a
   history entry.

   screen: 'lock' | 'lock-notifs' | 'home' (controlled by the parent). */
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
  onExit,
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
  const [dragY, setDragY] = useState(0); // lock screen, being swiped up
  const [appDrag, setAppDrag] = useState(0); // an app, being swiped up
  const [appLive, setAppLive] = useState(false); // ...and the finger is down
  const [backDx, setBackDx] = useState(null); // left edge swipe, in px
  const [ccOpen, setCcOpen] = useState(false);
  const [folderKey, setFolderKey] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [recents, setRecents] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [appClose, setAppClose] = useState(0);
  const [tutorial, setTutorial] = useState(false);
  const [tutorialMode, setTutorialMode] = useState('howto');
  const [depth, setDepth] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [wallpaper, setWp] = useState(savedWallpaper);
  const [net, setNet] = useState({ wifi: true, cell: true, bt: true, air: false });
  const [isFs, setIsFs] = useState(false);
  const [toastText, setToastText] = useState('');
  const [notifReady, setNotifReady] = useState(false);
  const pagerRef = useRef(null);
  const toastTimer = useRef(0);
  const unlocked = screen === 'home';
  const dark = theme === 'dark';
  const wpSrc = wallpaperSrc(wallpaper);
  const appVisible = !!activeApp && !switcher;

  const toast = useCallback((t) => {
    setToastText(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(''), 2300);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const setWallpaper = useCallback((id) => {
    setWp(id);
    saveWallpaper(id);
  }, []);

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

  /* ───── the browser's Back ─────
     Each thing opened (a folder, an app, Control Center, Search...) takes a
     history entry, so the browser's Back (or an edge swipe) closes it, one step
     at a time. Closing from the phone's own UI pops that entry, so the two never
     disagree. */
  const stack = useRef([]);
  const ignorePop = useRef(0);
  const sync = () => setDepth(stack.current.length);
  const top = () => stack.current[stack.current.length - 1];
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
    else if (kind === 'search') setSearchOpen(false);
    else if (kind === 'switcher') setSwitcher(false);
    else if (kind === 'tutorial') setTutorial(false);
    else if (kind === 'app') {
      setSwitcher(false);
      setAppClose((n) => n + 1);
    }
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

  /** One step back: whatever is on top closes. */
  const back = useCallback(() => {
    if (stack.current.length) window.history.back();
  }, []);

  // The first time the home screen shows, say how this phone works.
  useEffect(() => {
    if (!device || screen !== 'home' || tutorialSeen()) return undefined;
    const id = setTimeout(() => {
      setTutorialMode('howto');
      setTutorial(true);
      push('tutorial');
    }, 900);
    return () => clearTimeout(id);
  }, [device, screen, push]);
  const closeTutorial = () => {
    try {
      window.localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      /* private mode */
    }
    if (top() === 'tutorial') popEntry();
    setTutorial(false);
  };

  /* ───── full screen ───── */
  useEffect(() => {
    const on = () => setIsFs(!!document.fullscreenElement || isStandalone());
    on();
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    if (isStandalone()) {
      toast('Already full screen');
      return;
    }
    const el = document.documentElement;
    const howTo = () => {
      // iPhone Safari does not allow it from a page: say how to get it.
      setTutorialMode('fullscreen');
      setTutorial(true);
      push('tutorial');
    };
    if (document.fullscreenEnabled && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(howTo);
    else howTo();
  }, [toast, push]);

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
    if (searchOpen) {
      setSearchOpen(false);
      replaceTop('folder');
    } else push('folder');
    setFolderKey(key);
  };
  const openCc = () => {
    if (ccOpen) return;
    setCcOpen(true);
    push('cc');
  };
  const openSearch = () => {
    if (searchOpen) return;
    setSearchOpen(true);
    push('search');
  };
  const openSwitcher = () => {
    setAppLive(false);
    setAppDrag(0);
    setSwitcher(true);
    push('switcher');
  };
  const closeLayer = (kind, set) => {
    set();
    if (top() === kind) popEntry();
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
      // The layer it was opened from becomes the app's history entry.
      if (top() === 'switcher') {
        setSwitcher(false);
        popEntry(); // the app's own entry is under it
      } else if (['folder', 'cc', 'search'].includes(top())) {
        setFolderKey(null);
        setCcOpen(false);
        setSearchOpen(false);
        replaceTop('app');
      } else if (top() !== 'app') {
        push('app');
      }
      setRecents((r) => [recentOf(app), ...r.filter((x) => x.appKey !== app.appKey)].slice(0, 8));
      setAppDrag(0);
      setActiveApp({
        ...app,
        rect: rectOf(el),
        // the tile that grows into the app
        imgSrc: app.icon ? ICON(app.icon) : app.imgSrc,
        style: app.custom ? CUSTOM_BG[app.custom] : app.style || '#fff',
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rectOf, push, replaceTop, popEntry, searchOpen],
  );

  const appClosed = () => {
    setActiveApp(null);
    setAppDrag(0);
    setAppLive(false);
    if (top() === 'app') popEntry();
  };

  const fromNotification = (n) => {
    if (screen !== 'home') onScreenChange?.('home');
    setTimeout(() => open(n, null), 250);
  };
  const fromLockCamera = () => {
    onScreenChange?.('home');
    setTimeout(() => open({ id: 'camera', label: 'Camera', icon: 'camera', appKey: 'camera' }, null), 280);
  };

  /** Back to the home screen, from anywhere: every layer closes. */
  const goHome = () => {
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
    }
    setCcOpen(false);
    setFolderKey(null);
    setSearchOpen(false);
    setSwitcher(false);
    setTutorial(false);
    if (activeApp) setAppClose((c) => c + 1);
    pagerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  /* ───── gestures on the screen itself: swipe up to unlock (anywhere), pull
     down from the top right for Control Center, pull down on the home screen
     for Search. ───── */
  const start = useRef(null);
  const swipedAt = useRef(0);
  const layerOpen = ccOpen || !!folderKey || searchOpen || switcher || tutorial;

  const onDown = (e) => {
    if (inert) return;
    const o = screenRef.current.getBoundingClientRect();
    const lx = (e.clientX - o.left) / scale;
    const ly = (e.clientY - o.top) / scale;
    if (ly < 70 && lx > W * 0.5 && !ccOpen && !switcher && !searchOpen && !tutorial) start.current = { mode: 'cc', x: e.clientX, y: e.clientY, moved: false };
    else if (screen !== 'home' && !layerOpen && !activeApp) start.current = { mode: 'unlock', x: e.clientX, y: e.clientY, moved: false };
    else if (screen === 'home' && !layerOpen && !activeApp && ly > 70) start.current = { mode: 'search', x: e.clientX, y: e.clientY, moved: false };
  };
  const onMove = (e) => {
    const s = start.current;
    if (!s) return;
    const dy = (e.clientY - s.y) / scale;
    const dx = (e.clientX - s.x) / scale;
    if (s.mode === 'cc') {
      if (dy > 36 && Math.abs(dx) < 60) {
        s.moved = true;
        start.current = null;
        swipedAt.current = performance.now();
        openCc();
      }
      return;
    }
    if (s.mode === 'search') {
      if (dy > 70 && Math.abs(dx) < 50) {
        start.current = null;
        swipedAt.current = performance.now();
        openSearch();
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
    if (s?.moved) swipedAt.current = performance.now();
    const go = s && s.mode === 'unlock' && dragY < -120;
    setDragY(0);
    if (go) onScreenChange?.('home');
  };

  /* ───── the bottom edge (the Home indicator) ───── */
  const bs = useRef(null);
  const bDown = (e) => {
    if (inert) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const now = performance.now();
    bs.current = { y: e.clientY, ly: e.clientY, lt: now, dy: 0, v: 0, moved: false };
  };
  const bMove = (e) => {
    const s = bs.current;
    if (!s) return;
    const now = performance.now();
    const dy = Math.min(0, (e.clientY - s.y) / scale);
    s.v = (e.clientY - s.ly) / Math.max(1, now - s.lt) / scale; // px/ms, up is negative
    s.ly = e.clientY;
    s.lt = now;
    s.dy = dy;
    if (dy < -4) s.moved = true;
    if (!s.moved) return;
    if (appVisible) {
      setAppLive(true);
      setAppDrag(dy);
    } else if (screen !== 'home') setDragY(dy);
  };
  const bUp = () => {
    const s = bs.current;
    bs.current = null;
    if (!s) return;
    const held = performance.now() - s.lt > 90; // stopped before letting go
    const v = held ? 0 : s.v;
    setDragY(0);
    if (!s.moved) {
      // a tap on the indicator
      if (appVisible) setAppClose((n) => n + 1);
      else if (layerOpen) back();
      else if (unlocked) onScreenChange?.('lock');
      return;
    }
    swipedAt.current = performance.now();
    if (appVisible) {
      setAppLive(false);
      if (s.dy < -60) {
        // a flick goes home; pulling up and holding opens the switcher
        if (v < -0.45 || s.dy < -300) setAppClose((n) => n + 1);
        else openSwitcher();
      } else setAppDrag(0);
      return;
    }
    if (screen !== 'home') {
      if (s.dy < -120) onScreenChange?.('home');
      return;
    }
    if (layerOpen && s.dy < -50) {
      if (switcher) goHome();
      else back();
    }
  };

  /* ───── the left edge: swipe right = back ───── */
  const ls = useRef(null);
  const lDown = (e) => {
    if (inert || !stack.current.length) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    ls.current = { x: e.clientX };
    setBackDx(0);
  };
  const lMove = (e) => {
    if (!ls.current) return;
    setBackDx(Math.max(0, (e.clientX - ls.current.x) / scale));
  };
  const lUp = () => {
    if (!ls.current) return;
    const dx = backDx || 0;
    ls.current = null;
    setBackDx(null);
    if (dx > 70) back();
  };

  const ctx = useMemo(
    () => ({
      theme,
      setTheme: (t) => onThemeChange?.(t),
      openApp: (a) => open(a, null),
      close: () => setAppClose((n) => n + 1),
      showTutorial: () => {
        setTutorialMode('howto');
        setTutorial(true);
        push('tutorial');
      },
      wallpaper,
      setWallpaper,
      brightness,
      setBrightness,
      net,
      setNet,
      toast,
      fullscreen,
      isFullscreen: isFs,
      exit: onExit || null,
    }),
    [theme, onThemeChange, open, push, wallpaper, setWallpaper, brightness, net, toast, fullscreen, isFs, onExit],
  );

  /* ───── screen ───── */
  const under = ccOpen || !!folderKey || tutorial || searchOpen || switcher;
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
      <PhoneContext.Provider value={ctx}>
        <img className={`${styles.wallpaper} ${dark ? styles.wallpaperDark : ''}`} src={wpSrc} alt="" draggable={false} />
        <HomeScreen
          locked={!unlocked}
          under={under}
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
          wallpaper={wpSrc}
          onCamera={fromLockCamera}
          onNotifTap={fromNotification}
          onStatusTap={openCc}
        />

        {/* screen brightness (Control Center, Settings), under every overlay */}
        <div className={styles.dim} style={{ opacity: (1 - brightness) * 0.6 }} />

        <FolderOverlay folderKey={folderKey} onClose={() => closeLayer('folder', () => setFolderKey(null))} onOpenApp={open} />

        {/* The open app: it follows a finger swiping up from the bottom, small
            and rounded, then goes home or into the switcher. */}
        <div
          className={styles.appLayer}
          style={{
            transform: appDrag ? `translateY(${(appDrag * 0.22).toFixed(1)}px) scale(${(1 + appDrag / 1500).toFixed(4)})` : undefined,
            borderRadius: appDrag ? Math.min(48, -appDrag / 4) : undefined,
            opacity: switcher ? 0 : 1,
            pointerEvents: appVisible ? 'auto' : 'none',
            transition: appLive ? 'none' : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1), border-radius 300ms, opacity 220ms',
          }}
        >
          <AppSheet app={activeApp} onClose={appClosed} closeRequest={appClose} />
        </div>

        <Switcher
          open={switcher}
          recents={recents}
          activeKey={activeApp?.appKey}
          onOpen={(a) => (a.appKey === activeApp?.appKey ? closeLayer('switcher', () => setSwitcher(false)) : open(a, null))}
          onClose={(a) => {
            setRecents((r) => r.filter((x) => x.appKey !== a.appKey));
            if (a.appKey === activeApp?.appKey) setAppClose((n) => n + 1);
          }}
          onDismiss={() => {
            setRecents([]);
            goHome();
          }}
          onHome={goHome}
        />
        <Search open={searchOpen} onClose={() => closeLayer('search', () => setSearchOpen(false))} onOpenApp={open} onOpenFolder={openFolder} />
        <ControlCenter
          open={ccOpen}
          onClose={() => closeLayer('cc', () => setCcOpen(false))}
          theme={theme}
          onTheme={(t) => onThemeChange?.(t)}
          brightness={brightness}
          onBrightness={setBrightness}
          onOpenApp={(a) => open(a, null)}
        />
        <Tutorial open={tutorial} mode={tutorialMode} onClose={closeTutorial} />
        <Toast text={toastText} />
      </PhoneContext.Provider>

      {/* the edges: bottom (the Home indicator) and left (back) */}
      {!inert && (
        <>
          <div
            className={ov.edgeBottom}
            onPointerDown={bDown}
            onPointerMove={bMove}
            onPointerUp={bUp}
            onPointerCancel={bUp}
            role="button"
            aria-label={appVisible || layerOpen ? 'Home indicator: swipe up to go home' : unlocked ? 'Home indicator: tap to lock' : 'Home indicator: swipe up to unlock'}
          />
          <div className={ov.edgeLeft} onPointerDown={lDown} onPointerMove={lMove} onPointerUp={lUp} onPointerCancel={lUp} aria-hidden />
          {backDx !== null && (
            <div className={ov.backHint} style={{ transform: `translateX(${Math.min(70, backDx) - 6}px)`, opacity: Math.min(1, backDx / 40) }}>
              <Glyph name="back" size={22} />
            </div>
          )}
        </>
      )}
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
      <div className="ios26" data-theme={theme} data-depth={depth} style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: ROOM, touchAction: 'none' }}>
        {/* The shadow is its own box, never a `filter` on the phone: in Safari a
            filtered ancestor switches off every backdrop-filter inside it (all the
            glass). */}
        <div aria-hidden style={{ position: 'absolute', left: g.left + g.w * 0.03, top: g.top + g.h * 0.02, width: g.w * 0.94, height: g.h * 0.96, borderRadius: g.w * 0.13, boxShadow: '0 30px 50px rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', left: g.left, top: g.top, width: g.w, height: g.h }}>{stage}</div>
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
