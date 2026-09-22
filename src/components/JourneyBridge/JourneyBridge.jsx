import { useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getCenteredWindowPosition } from '../../utils/animationOrigin.js';

const FINDER_SIZE = { width: 920, height: 580 };

/* Safety net: if the tour never resolves (target missing, race, etc.),
   don't leave a first-time visitor without the Portfolio window forever. */
// Deadlock guard only (tour never mounts / never reports "seen"). Must be long
// enough that someone reading the 3-step tour is never interrupted by Finder.
const TOUR_GATE_TIMEOUT_MS = 60_000;

/** Auto-opens portfolio window after hello screen dismisses — and, for
 * first-time visitors, after the onboarding tour has finished so the two
 * don't visually collide. */
export default function JourneyBridge() {
  const { helloDismissed, shouldAutoOpenPortfolio, tourBlocking, launchApp } = useOS();
  const didAutoOpen = useRef(false);

  useEffect(() => {
    if (!helloDismissed || !shouldAutoOpenPortfolio) {
      if (!helloDismissed) didAutoOpen.current = false;
      return undefined;
    }
    if (didAutoOpen.current) return undefined;

    const open = () => {
      if (didAutoOpen.current) return;
      didAutoOpen.current = true;
      launchApp('finder', { position: getCenteredWindowPosition(FINDER_SIZE) });
    };

    if (!tourBlocking) {
      const timer = setTimeout(open, 600);
      return () => clearTimeout(timer);
    }

    const fallback = setTimeout(open, TOUR_GATE_TIMEOUT_MS);
    return () => clearTimeout(fallback);
  }, [helloDismissed, shouldAutoOpenPortfolio, tourBlocking, launchApp]);

  return null;
}
