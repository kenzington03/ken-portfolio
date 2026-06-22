import { useCallback, useEffect, useState } from 'react';

const NUDGE_DURATION_MS = 90_000;
const PULSE_DURATION_MS = 30_000;

/** Hello screen shows on every page load / visit. */
export function useJourneyState() {
  const [helloVisible, setHelloVisible] = useState(true);
  const [helloDismissed, setHelloDismissed] = useState(false);
  const [shouldAutoOpenPortfolio, setShouldAutoOpenPortfolio] = useState(false);
  const [portfolioOpened, setPortfolioOpened] = useState(false);
  const [portfolioPulseActive, setPortfolioPulseActive] = useState(true);
  const [nudgeExpired, setNudgeExpired] = useState(false);

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
    setShouldAutoOpenPortfolio(true);
  }, []);

  const markPortfolioOpened = useCallback(() => {
    setPortfolioOpened(true);
    setPortfolioPulseActive(false);
  }, []);

  const showEasterEggNudge = !portfolioOpened && !nudgeExpired;

  return {
    helloVisible,
    helloDismissed,
    shouldAutoOpenPortfolio,
    portfolioOpened,
    portfolioPulseActive,
    dismissHello,
    markPortfolioOpened,
    showEasterEggNudge,
  };
}
