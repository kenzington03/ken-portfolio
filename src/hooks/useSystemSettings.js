import { useSyncExternalStore } from 'react';

// The Mac's quick settings (Control Center): Wi-Fi, Bluetooth, AirDrop,
// Focus, the display's brightness and light or dark. Shared by the menu bar,
// Control Center and the desktop, and kept between visits.
const KEY = 'ken:system';
const DEFAULTS = {
  wifi: true,
  bluetooth: true,
  airdrop: false,
  focus: false,
  brightness: 1,
  appearance: 'dark',
  accent: '#0a84ff',
  nightShift: false,
  volume: 0.6,
  notifications: true,
  previews: true,
  dockMagnify: true,
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

let state = typeof window === 'undefined' ? { ...DEFAULTS } : load();
const listeners = new Set();

function apply() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.appearance = state.appearance;
  // The accent colour, as in System Settings: buttons, selections, toggles.
  root.style.setProperty('--accent', state.accent);
  root.style.setProperty('--accent-muted', `${state.accent}33`);
  root.classList.toggle('night-shift', state.nightShift);
}
apply();

export function setSystem(patch) {
  state = { ...state, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  apply();
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSystemSettings() {
  return useSyncExternalStore(subscribe, () => state, () => DEFAULTS);
}
