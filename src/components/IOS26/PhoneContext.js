import { createContext, useContext } from 'react';

/* What a screen can ask of the phone it runs on. IOS26Phone provides it; the
   status bar, the app screens, Control Center and Settings read it. */
const noop = () => {};
export const PhoneContext = createContext({
  theme: 'dark',
  setTheme: noop,
  openApp: noop,
  close: noop,
  showTutorial: noop,
  wallpaper: 'default',
  setWallpaper: noop,
  brightness: 1,
  setBrightness: noop,
  net: { wifi: true, cell: true, bt: true, air: false },
  setNet: noop,
  toast: noop,
  fullscreen: noop,
  isFullscreen: false,
  exit: null,
});

export const usePhone = () => useContext(PhoneContext);
