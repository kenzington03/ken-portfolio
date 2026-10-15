import { useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { RIGHT_DOCK_RESERVE } from '../../utils/animationOrigin.js';

// The desk Ken left: About and the Resume already open, Portfolio on top,
// a little off-centre, so the screen looks lived in rather than staged.
const MESSY_GAP_MS = 160;

/* Safety net: if the tour never resolves (target missing, race, etc.),
   don't leave a first-time visitor without the Portfolio window forever. */
// Deadlock guard only (tour never mounts / never reports "seen"). Must be long
// enough that someone reading the 3-step tour is never interrupted by Finder.
const TOUR_GATE_TIMEOUT_MS = 60_000;

/** Auto-opens the desk (About, Resume, then Portfolio on top) after the
 * hello screen dismisses, and, for first-time visitors, after the onboarding
 * tour has finished so the two don't visually collide. */
export default function JourneyBridge() {
  const { helloDismissed, shouldAutoOpenPortfolio, tourBlocking, launchApp } = useOS();
  const didAutoOpen = useRef(false);
  // launchApp changes with every window that opens; the sequence must not
  // restart (or be cancelled) because of that.
  const launchRef = useRef(launchApp);
  launchRef.current = launchApp;
  const sequence = useRef([]);

  useEffect(() => () => sequence.current.forEach(clearTimeout), []);

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
      const vh = window.innerHeight;
      const usableW = window.innerWidth - RIGHT_DOCK_RESERVE;
      // Narrow screens: just Portfolio, there is no room to be messy.
      if (usableW < 980) {
        launch('finder', { auto: true });
        return;
      }
      launch('about', { auto: true, position: { x: Math.round(usableW * 0.03), y: 46 } });
      sequence.current.push(
        setTimeout(() => launch('pdfviewer', { auto: true, position: { x: Math.round(usableW - 680 - usableW * 0.02), y: Math.round(vh * 0.16) } }), MESSY_GAP_MS),
        // Portfolio on top, nearly full screen (the roomy work size), so the
        // work gets the room; About and the Resume peek out behind it.
        setTimeout(() => launch('finder', { auto: true }), MESSY_GAP_MS * 2),
      );
    };

    const timer = setTimeout(open, tourBlocking ? TOUR_GATE_TIMEOUT_MS : 600);
    return () => clearTimeout(timer);
  }, [helloDismissed, shouldAutoOpenPortfolio, tourBlocking]);

  return null;
}
