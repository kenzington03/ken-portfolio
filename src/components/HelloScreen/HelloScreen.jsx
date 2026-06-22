import { useCallback, useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './HelloScreen.module.css';

const STROKE_TITLE = "Welcome, to Ken's OS.";

const TIMING = {
  strokeFadeStart: 7200,
  welcomeIn: 7800,
  ctaIn: 10200,
  canDismiss: 7800,
  autoDismiss: 20000,
  exitMs: 1000,
};

export default function HelloScreen() {
  const { helloVisible, dismissHello } = useOS();
  const [showStroke, setShowStroke] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dismissedRef = useRef(false);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setExiting(true);
    setTimeout(() => dismissHello(), TIMING.exitMs);
  }, [dismissHello]);

  useEffect(() => {
    if (!helloVisible) return undefined;

    dismissedRef.current = false;
    setShowStroke(true);
    setShowWelcome(false);
    setShowCta(false);
    setCanDismiss(false);
    setExiting(false);

    const strokeFadeTimer = setTimeout(() => setShowStroke(false), TIMING.strokeFadeStart);
    const welcomeInTimer = setTimeout(() => setShowWelcome(true), TIMING.welcomeIn);
    const ctaTimer = setTimeout(() => setShowCta(true), TIMING.ctaIn);
    const dismissTimer = setTimeout(() => setCanDismiss(true), TIMING.canDismiss);
    const autoDismissTimer = setTimeout(() => handleDismiss(), TIMING.autoDismiss);

    return () => {
      clearTimeout(strokeFadeTimer);
      clearTimeout(welcomeInTimer);
      clearTimeout(ctaTimer);
      clearTimeout(dismissTimer);
      clearTimeout(autoDismissTimer);
    };
  }, [helloVisible, handleDismiss]);

  if (!helloVisible) return null;

  return (
    <div
      className={`${styles.helloScreen} ${exiting ? styles.exiting : ''}`}
      onClick={() => canDismiss && handleDismiss()}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <div className={styles.gradientBg} aria-hidden />
      <div className={styles.scrim} aria-hidden />
      <div className={styles.inner}>
        <div className={styles.stage}>
          <div className={`${styles.strokePhase} ${!showStroke ? styles.strokePhaseOut : ''}`}>
            <h1 className={styles.drawTitle}>
              <span className={styles.drawOutline} aria-hidden="true">
                {STROKE_TITLE}
              </span>
              <span className={styles.drawFill}>{STROKE_TITLE}</span>
            </h1>
          </div>

          <div className={`${styles.welcomePhase} ${showWelcome ? styles.welcomePhaseIn : ''}`}>
            <div className={styles.textPanel}>
              <p className={styles.subtitle}>
                A portfolio experience inspired by Apple macOS.
              </p>
              <p className={`${styles.subtitle} ${styles.subtitleItalic}`}>
                Explore my work, background, and get in touch.
              </p>
              <button
                type="button"
                className={`${styles.cta} ${showCta ? styles.ctaVisible : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canDismiss) handleDismiss();
                }}
              >
                Let&apos;s explore →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
