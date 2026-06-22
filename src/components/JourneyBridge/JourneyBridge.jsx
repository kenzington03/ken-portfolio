import { useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getCenteredWindowPosition } from '../../utils/animationOrigin.js';

const FINDER_SIZE = { width: 920, height: 580 };

/** Auto-opens portfolio window after hello screen dismisses. */
export default function JourneyBridge() {
  const { helloDismissed, shouldAutoOpenPortfolio, launchApp } = useOS();
  const didAutoOpen = useRef(false);

  useEffect(() => {
    if (!helloDismissed || !shouldAutoOpenPortfolio) {
      if (!helloDismissed) didAutoOpen.current = false;
      return undefined;
    }
    if (didAutoOpen.current) return undefined;

    didAutoOpen.current = true;
    const timer = setTimeout(() => {
      launchApp('finder', { position: getCenteredWindowPosition(FINDER_SIZE) });
    }, 600);

    return () => clearTimeout(timer);
  }, [helloDismissed, shouldAutoOpenPortfolio, launchApp]);

  return null;
}
