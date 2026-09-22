import { useCallback, useState } from 'react';

const PREFIX = 'kenos:seen:';

/**
 * Tracks whether the visitor has already seen/dismissed a one-time hint,
 * persisted in localStorage so it never nags a returning visitor again.
 * Returns [seen, markSeen].
 */
export function useSeenOnce(key) {
  const storageKey = PREFIX + key;

  const [seen, setSeen] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      window.localStorage.setItem(storageKey, '1');
    } catch {
      /* localStorage unavailable — hint just won't persist across visits */
    }
  }, [storageKey]);

  return [seen, markSeen];
}
