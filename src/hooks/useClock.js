import { useEffect, useState } from 'react';

/**
 * The current time, formatted by `format`, re-read on each minute boundary
 * (and when the tab comes back), so a printed clock never goes stale.
 */
export default function useClock(format) {
  const [text, setText] = useState(() => format(new Date()));
  useEffect(() => {
    let id;
    const tick = () => {
      const now = new Date();
      setText(format(now));
      id = setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
    };
    const wake = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(id);
      tick();
    };
    tick();
    document.addEventListener('visibilitychange', wake);
    return () => {
      clearTimeout(id);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [format]);
  return text;
}
