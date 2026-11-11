// v3: Ken's own wallpapers (Oct 2026); earlier picks reset once.
export const WALLPAPER_STORAGE_KEY = 'kenneth-os-wallpaper-v5';
export const DESKTOP_BG_STORAGE_KEY = 'kenneth-os-desktop-bg-index';

/** Image files in public/assets/backgrounds/: Apple's own macOS default
    wallpapers, Tahoe back to Big Sur (Ken, Nov 2 2026: "Apple styled
    wallpapers only, whatever a MacBook uses"; the older ones from Stephen
    Hackett's 512pixels.net archive, resized to 2880px). These are Apple's
    copyrighted images, used at the user's explicit direction overriding
    this project's earlier "don't reuse Apple wallpapers" note, a real
    licensing risk on a public site, accepted knowingly rather than
    silently. */
export const DESKTOP_BACKGROUNDS = [
  { id: 'tahoe-light', label: 'Tahoe (Light)', src: '/assets/backgrounds/tahoe-light.webp' },
  { id: 'tahoe-dark', label: 'Tahoe (Dark)', src: '/assets/backgrounds/tahoe-dark.webp' },
  { id: 'tahoe-beach', label: 'Tahoe (Beach)', src: '/assets/backgrounds/tahoe-beach-day.webp' },
  { id: 'sequoia-light', label: 'Sequoia (Light)', src: '/assets/backgrounds/sequoia-light.webp' },
  { id: 'sequoia-dark', label: 'Sequoia (Dark)', src: '/assets/backgrounds/sequoia-dark.webp' },
  { id: 'sonoma-light', label: 'Sonoma (Light)', src: '/assets/backgrounds/sonoma-light.webp' },
  { id: 'sonoma-dark', label: 'Sonoma (Dark)', src: '/assets/backgrounds/sonoma-dark.webp' },
  { id: 'ventura-light', label: 'Ventura (Light)', src: '/assets/backgrounds/ventura-light.webp' },
  { id: 'ventura-dark', label: 'Ventura (Dark)', src: '/assets/backgrounds/ventura-dark.webp' },
  { id: 'monterey-light', label: 'Monterey (Light)', src: '/assets/backgrounds/monterey-light.webp' },
  { id: 'monterey-dark', label: 'Monterey (Dark)', src: '/assets/backgrounds/monterey-dark.webp' },
  { id: 'big-sur', label: 'Big Sur', src: '/assets/backgrounds/big-sur.webp' },
];

// Apple's only (Ken's call): what a MacBook ships with.
export const WALLPAPER_OPTIONS = DESKTOP_BACKGROUNDS.map((bg) => ({
  id: bg.id,
  label: bg.label,
  type: 'image',
  src: bg.src,
}));

export function getWallpaperById(id) {
  return WALLPAPER_OPTIONS.find((w) => w.id === id) ?? WALLPAPER_OPTIONS[0];
}

/** A real Mac's wallpaper (Ken, Oct 30 2026): Tahoe dark, which also
 * continues the dark room the Mac arrives from. */
const DEFAULT_WALLPAPER_ID = 'tahoe-dark';

export function loadStoredWallpaper() {
  try {
    const stored = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (stored && WALLPAPER_OPTIONS.some((w) => w.id === stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WALLPAPER_ID;
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
