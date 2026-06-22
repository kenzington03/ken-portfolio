import { useCallback, useEffect, useState } from 'react';
import {
  WALLPAPER_STORAGE_KEY,
  loadStoredWallpaper,
} from '../data/wallpapers.js';
import { getCenteredWindowPosition } from '../utils/animationOrigin.js';

let nextZIndex = 10;
let nextWindowId = 1;

const DEFAULT_SIZE = { width: 720, height: 480 };
const SCALE_CLOSE_MS = 260;
const SCALE_OPEN_MS = 280;

export function useWindowManager() {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [wallpaper, setWallpaperState] = useState(loadStoredWallpaper);
  const [screensaverActive, setScreensaverActive] = useState(false);

  const setWallpaper = useCallback((id) => {
    setWallpaperState(id);
    try {
      localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (wallpaper !== 'tubes') return;
    const img = new Image();
    img.onerror = () => setWallpaper('default');
    img.src = '/assets/ui/wallpaper-tubes.jpg';
  }, [wallpaper, setWallpaper]);

  const focusWindow = useCallback((id) => {
    setActiveWindowId(id);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, zIndex: ++nextZIndex, minimized: false, minimizing: false } : w
      )
    );
  }, []);

  const openWindow = useCallback(
    ({ appId, title, component, size, position, data, animationOrigin }) => {
      const id = `win-${nextWindowId++}`;
      const winSize = size ?? DEFAULT_SIZE;
      const originPosition = position ?? getCenteredWindowPosition(winSize);
      const win = {
        id,
        appId,
        title,
        component,
        data: data ?? null,
        size: winSize,
        position: originPosition,
        zIndex: ++nextZIndex,
        minimized: false,
        maximized: false,
        opening: true,
        closing: false,
        minimizing: false,
        animationOrigin: animationOrigin ?? null,
      };
      setWindows((prev) => [...prev, win]);
      setActiveWindowId(id);
      setTimeout(() => {
        setWindows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, opening: false } : w))
        );
      }, SCALE_OPEN_MS);
      return id;
    },
    [windows.length]
  );

  const closeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, closing: true } : w))
    );
    setTimeout(() => {
      setWindows((prev) => {
        const next = prev.filter((w) => w.id !== id);
        setActiveWindowId((active) => {
          if (active !== id) return active;
          return next.length ? next[next.length - 1].id : null;
        });
        return next;
      });
    }, SCALE_CLOSE_MS);
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimizing: true } : w))
    );
    setTimeout(() => {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, minimized: true, minimizing: false } : w
        )
      );
      setActiveWindowId((active) => (active === id ? null : active));
    }, 200);
  }, []);

  const toggleMaximize = useCallback(
    (id) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
      );
      focusWindow(id);
    },
    [focusWindow]
  );

  const updateWindowPosition = useCallback((id, position) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position } : w))
    );
  }, []);

  const updateWindowSize = useCallback((id, size) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  const restoreFromDock = useCallback(
    (appId) => {
      const win = windows.find((w) => w.appId === appId);
      if (win) {
        focusWindow(win.id);
        return win.id;
      }
      return null;
    },
    [windows, focusWindow]
  );

  const windowCount = windows.filter((w) => !w.minimized).length;

  return {
    windows,
    activeWindowId,
    wallpaper,
    setWallpaper,
    screensaverActive,
    setScreensaverActive,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    restoreFromDock,
    windowCount,
  };
}
