/** Space reserved on the right for desktop dock icons (dock + breathing room). */
export const RIGHT_DOCK_RESERVE = 160;

/** Capture icon position at click time (viewport coords) for window scale animation. */
export function getOriginFromElement(el) {
  if (!el?.getBoundingClientRect) return null;
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function getOriginFromEvent(event) {
  if (!event?.currentTarget) return null;
  const target = event.currentTarget;
  const anchor =
    (target.hasAttribute?.('data-animation-origin') && target) ||
    target.querySelector?.('[data-animation-origin]') ||
    target;
  return getOriginFromElement(anchor);
}

/** Set translate+scale CSS vars so window animates from icon centre. */
export function applyScaleOrigin(el, origin) {
  if (!el || !origin) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const tx = origin.x - cx;
  const ty = origin.y - cy;
  el.style.setProperty('--scale-tx', `${tx}px`);
  el.style.setProperty('--scale-ty', `${ty}px`);
}

/** Position window to the left of a right-dock icon, vertically centred on it. */
export function getWindowPositionFromOrigin(size, origin, offset = 0) {
  if (!origin) return null;
  const margin = 16;
  const iconRight = origin.left + origin.width;
  let x = iconRight - size.width - margin;
  let y = origin.y - size.height / 2 + offset;

  if (typeof window !== 'undefined') {
    const maxRight = window.innerWidth - RIGHT_DOCK_RESERVE;
    if (x + size.width > maxRight) {
      x = maxRight - size.width;
    }
    const maxY = window.innerHeight - size.height - margin;
    x = Math.max(margin, Math.min(x, maxRight - size.width));
    y = Math.max(28, Math.min(y, maxY));
  }

  return { x, y };
}

/** Clamp any window position so its right edge clears the right dock. */
export function clampWindowPosition(position, size) {
  if (typeof window === 'undefined') return position;
  const margin = 16;
  const maxRight = window.innerWidth - RIGHT_DOCK_RESERVE;
  let { x, y } = position;
  if (x + size.width > maxRight) {
    x = Math.max(margin, maxRight - size.width);
  }
  x = Math.max(margin, x);
  return { x, y };
}

/** Centre a window in the viewport, respecting menubar and right dock. */
export function getCenteredWindowPosition(size) {
  if (typeof window === 'undefined') return { x: 120, y: 80 };
  const margin = 16;
  const menubar = 28;
  const maxRight = window.innerWidth - RIGHT_DOCK_RESERVE;
  let x = (window.innerWidth - size.width) / 2;
  let y = (window.innerHeight - size.height) / 2;
  x = Math.max(margin, Math.min(x, maxRight - size.width));
  y = Math.max(menubar, Math.min(y, window.innerHeight - size.height - margin));
  return { x, y };
}

/** @deprecated alias */
export const applyGenieOriginToElement = applyScaleOrigin;
