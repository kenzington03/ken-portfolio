import { useCallback, useState } from 'react';

let nextZIndex = 10;
let nextWindowId = 1;

const DEFAULT_SIZE = { width: 720, height: 480 };
const DEFAULT_POSITION = { x: 120, y: 80 };

export function useWindowManager() {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [wallpaper, setWallpaper] = useState('default');
  const [screensaverActive, setScreensaverActive] = useState(false);

  const focusWindow = useCallback((id) => {
    setActiveWindowId(id);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, zIndex: ++nextZIndex, minimized: false } : w
      )
    );
  }, []);

  const openWindow = useCallback(
    ({ appId, title, component, size, position, data }) => {
      const id = `win-${nextWindowId++}`;
      const offset = (windows.length % 6) * 24;
      const win = {
        id,
        appId,
        title,
        component,
        data: data ?? null,
        size: size ?? DEFAULT_SIZE,
        position: position ?? {
          x: DEFAULT_POSITION.x + offset,
          y: DEFAULT_POSITION.y + offset,
        },
        zIndex: ++nextZIndex,
        minimized: false,
        maximized: false,
      };
      setWindows((prev) => [...prev, win]);
      setActiveWindowId(id);
      return id;
    },
    [windows.length]
  );

  const closeWindow = useCallback((id) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      setActiveWindowId((active) => {
        if (active !== id) return active;
        return next.length ? next[next.length - 1].id : null;
      });
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
    setActiveWindowId((active) => (active === id ? null : active));
  }, []);

  const toggleMaximize = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
    focusWindow(id);
  }, [focusWindow]);

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
        if (win.minimized) focusWindow(win.id);
        else focusWindow(win.id);
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
