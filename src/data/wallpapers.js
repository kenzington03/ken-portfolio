export const WALLPAPER_STORAGE_KEY = 'kenneth-os-wallpaper';
export const DESKTOP_BG_STORAGE_KEY = 'kenneth-os-desktop-bg-index';

/** Image files in public/assets/backgrounds/ */
export const DESKTOP_BACKGROUNDS = [
  { id: 'bg1', label: 'Background 1', src: '/assets/backgrounds/background-1.jpg' },
  { id: 'bg2', label: 'Background 2', src: '/assets/backgrounds/background-2.avif' },
  { id: 'bg3', label: 'Background 3', src: '/assets/backgrounds/background-3.jpg' },
];

export const WALLPAPER_OPTIONS = [
  ...DESKTOP_BACKGROUNDS.map((bg) => ({
    id: bg.id,
    label: bg.label,
    type: 'image',
    src: bg.src,
  })),
  { id: 'default', label: 'Default Dark', type: 'css', cssClass: 'default' },
  { id: 'aurora', label: 'Aurora', type: 'css', cssClass: 'aurora' },
  {
    id: 'tubes',
    label: 'Tubes',
    type: 'image',
    src: '/assets/ui/wallpaper-tubes.jpg',
    optional: true,
  },
];

export function getWallpaperById(id) {
  return WALLPAPER_OPTIONS.find((w) => w.id === id) ?? WALLPAPER_OPTIONS[0];
}

export function loadStoredWallpaper() {
  try {
    const stored = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (stored && WALLPAPER_OPTIONS.some((w) => w.id === stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return DESKTOP_BACKGROUNDS[0]?.id ?? 'bg1';
}

export function loadDesktopBgIndex() {
  try {
    const stored = localStorage.getItem(DESKTOP_BG_STORAGE_KEY);
    const idx = Number(stored);
    if (Number.isFinite(idx) && idx >= 0 && idx < DESKTOP_BACKGROUNDS.length) {
      return idx;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function getNextDesktopBgIndex(current) {
  return (current + 1) % DESKTOP_BACKGROUNDS.length;
}
