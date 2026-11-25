/* Wallpapers for Settings. The first is the iOS 26 kit's own; the rest are the
   site's own backdrops (public/assets/backgrounds), so nothing new is bundled. */
const B = '/assets/backgrounds/';
export const WALLPAPERS = [
  { id: 'default', label: 'iOS 26', src: '/assets/ios26/chrome/wallpaper.jpg' },
  { id: 'tahoe-light', label: 'Tahoe', src: `${B}tahoe-light.webp` },
  { id: 'tahoe-dark', label: 'Tahoe Night', src: `${B}tahoe-dark.webp` },
  { id: 'beach', label: 'Beach', src: `${B}tahoe-beach-day.webp` },
  { id: 'sequoia', label: 'Sequoia', src: `${B}sequoia-light.webp` },
  { id: 'sonoma', label: 'Sonoma', src: `${B}sonoma-light.webp` },
  { id: 'ventura', label: 'Ventura', src: `${B}ventura-light.webp` },
  { id: 'monterey', label: 'Monterey', src: `${B}monterey-light.webp` },
  { id: 'big-sur', label: 'Big Sur', src: `${B}big-sur.webp` },
];
const KEY = 'ken-ios-wallpaper';
export const savedWallpaper = () => {
  try {
    const id = window.localStorage.getItem(KEY);
    return WALLPAPERS.some((w) => w.id === id) ? id : 'default';
  } catch {
    return 'default';
  }
};
export const saveWallpaper = (id) => {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* private mode: it just resets next visit */
  }
};
export const wallpaperSrc = (id) => (WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0]).src;
