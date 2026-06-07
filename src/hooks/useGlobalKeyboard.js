import { useEffect } from 'react';
import { GAME_APP_IDS } from '../data/funZone.js';

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[data-app="terminal"]')) return true;
  return false;
}

export function useGlobalKeyboard({
  activeWindowId,
  closeWindow,
  windows,
  spotlightOpen,
  onSpotlightToggle,
}) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        onSpotlightToggle?.();
        return;
      }

      if (spotlightOpen) return;
      if (isTypingTarget(e.target)) return;
      if (!activeWindowId) return;

      const win = windows.find((w) => w.id === activeWindowId && !w.minimized && !w.closing);
      if (!win) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        closeWindow(activeWindowId);
        return;
      }

      if (e.code !== 'Space' && e.key !== ' ') return;
      if (e.repeat) return;
      if (GAME_APP_IDS.has(win.appId)) return;

      e.preventDefault();
      closeWindow(activeWindowId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeWindowId, closeWindow, windows, spotlightOpen, onSpotlightToggle]);
}
