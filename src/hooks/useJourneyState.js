import { useCallback, useEffect, useState } from 'react';
import { track } from '../utils/track.js';

const NUDGE_DURATION_MS = 90_000;
const PULSE_DURATION_MS = 30_000;

/** Hello screen shows on every page load / visit, unless the scroll intro
 * (MacBook → lock screen) replaces it. */
export function useJourneyState({ skipHello = false } = {}) {
  const [helloVisible, setHelloVisible] = useState(!skipHello);
  const [helloDismissed, setHelloDismissed] = useState(false);
  const [shouldAutoOpenPortfolio, setShouldAutoOpenPortfolio] = useState(false);
  const [portfolioOpened, setPortfolioOpened] = useState(false);
  const [portfolioPulseActive, setPortfolioPulseActive] = useState(true);
  const [nudgeExpired, setNudgeExpired] = useState(false);
  /* Holds the Portfolio auto-open while the first-visit tour is up: the tour
     points at the Dock and the cat, then Portfolio opens. Only a visitor who
     has not seen the tour is held. */
  const [tourBlocking, setTourBlocking] = useState(() => {
    try {
      return window.localStorage.getItem('kenos:seen:onboarding-tour-v3') !== '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => setPortfolioPulseActive(false), PULSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setNudgeExpired(true), NUDGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismissHello = useCallback(() => {
    setHelloVisible(false);
    setHelloDismissed(true);
    track('mac_opened');
    setShouldAutoOpenPortfolio(true);
  }, []);

  const markPortfolioOpened = useCallback(() => {
    setPortfolioOpened(true);
    setPortfolioPulseActive(false);
  }, []);

  const clearTourGate = useCallback(() => setTourBlocking(false), []);

  const showEasterEggNudge = !portfolioOpened && !nudgeExpired;

  return {
    helloVisible,
    helloDismissed,
    shouldAutoOpenPortfolio,
    portfolioOpened,
    portfolioPulseActive,
    tourBlocking,
    clearTourGate,
    dismissHello,
    markPortfolioOpened,
    showEasterEggNudge,
  };
}
