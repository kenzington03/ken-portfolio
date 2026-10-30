import { useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getOriginFromElement } from '../../utils/animationOrigin.js';

// Arriving on the desk: a beat to see it, then Portfolio opens on its own,
// out of its icon. One window, not a pile of them.
const OPEN_AFTER_MS = 1100;

/* Safety net: if the tour never resolves (target missing, race, etc.),
   don't leave a first-time visitor without the Portfolio window forever. */
const TOUR_GATE_TIMEOUT_MS = 60_000;

/** Opens Portfolio, from its icon, once the desk has said hello. */
export default function JourneyBridge() {
  const { helloDismissed, shouldAutoOpenPortfolio, tourBlocking, launchApp } = useOS();
  const didAutoOpen = useRef(false);
  // launchApp changes with every window that opens; the sequence must not
  // restart (or be cancelled) because of that.
  const launchRef = useRef(launchApp);
  launchRef.current = launchApp;
  useEffect(() => {
    if (!helloDismissed || !shouldAutoOpenPortfolio) {
      if (!helloDismissed) didAutoOpen.current = false;
      return undefined;
    }
    if (didAutoOpen.current) return undefined;

    const launch = (...args) => launchRef.current(...args);
    const open = () => {
      if (didAutoOpen.current) return;
      didAutoOpen.current = true;
      const icon = document.querySelector('[data-icon="portfolio"] [data-animation-origin]');
      launch('finder', { auto: true, animationOrigin: getOriginFromElement(icon) });
    };

    const timer = setTimeout(open, tourBlocking ? TOUR_GATE_TIMEOUT_MS : OPEN_AFTER_MS);
    return () => clearTimeout(timer);
  }, [helloDismissed, shouldAutoOpenPortfolio, tourBlocking]);

  return null;
}
