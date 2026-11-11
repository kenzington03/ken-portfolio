import { useCallback, useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { useSeenOnce } from '../../hooks/useSeenOnce.js';
import styles from './OnboardingTour.module.css';

// Three things worth knowing, in the order a visitor needs them.
const STEPS = [
  {
    selector: '[data-tour="dock-portfolio"]',
    title: 'The work',
    text: 'Portfolio holds the projects, best work first. It opens on its own in a moment, and lives here in the Dock.',
    placement: 'top',
  },
  {
    selector: '[data-tour="cat"]',
    title: 'Meet Toothless',
    text: 'He lives on this Mac and climbs whatever you open. Right-click him for tricks.',
    placement: 'top',
  },
  {
    selector: '[data-tour="menu-apple"]',
    title: 'Done looking?',
    text: 'Shut Down is in this menu. Or scroll up twice on the desktop, away from any window, to close the Mac.',
    placement: 'bottom',
  },
];

const BUBBLE_WIDTH = 260;
const GAP = 16;
const SPOTLIGHT_PAD = 8;

export default function OnboardingTour() {
  const { helloVisible, helloDismissed, clearTourGate } = useOS();
  const [seen, markSeen] = useSeenOnce('onboarding-tour-v3');
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (helloVisible || !helloDismissed || seen) return undefined;
    const timer = setTimeout(() => setActive(true), 900);
    return () => clearTimeout(timer);
  }, [helloVisible, helloDismissed, seen]);

  /* Nothing left to run this session (already seen, or the tour's first
     target never showed up), release the Portfolio auto-open gate. */
  useEffect(() => {
    if (seen) clearTourGate();
  }, [seen, clearTourGate]);

  const measure = useCallback(() => {
    const step = STEPS[stepIndex];
    const el = step ? document.querySelector(step.selector) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [stepIndex]);

  useEffect(() => {
    if (!active) return undefined;
    measure();
    const id = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', measure);
    };
  }, [active, measure]);

  // A step whose target is not on screen (the cat hidden, say) is skipped
  // after a moment, so the tour never stalls the visit.
  const missing = active && !seen && (!rect || rect.width === 0);
  useEffect(() => {
    if (!missing) return undefined;
    const t = setTimeout(() => {
      if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
      else {
        setActive(false);
        markSeen();
        clearTourGate();
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [missing, stepIndex, markSeen, clearTourGate]);

  if (!active || seen) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const finish = () => {
    setActive(false);
    markSeen();
    clearTourGate();
    try {
      // The tour said hello for him: Toothless does not say it again.
      window.localStorage.setItem('toothless-met', '1');
    } catch {
      /* private mode */
    }
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  // Target not (yet) on screen, e.g. covered/unmounted. Don't block the visit.
  if (!rect || rect.width === 0) return null;

  const spotlightStyle = {
    left: rect.left - SPOTLIGHT_PAD,
    top: rect.top - SPOTLIGHT_PAD,
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };

  const bubbleStyle = { width: BUBBLE_WIDTH };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (step.placement === 'top') {
    bubbleStyle.left = Math.min(Math.max(cx, BUBBLE_WIDTH / 2 + 12), window.innerWidth - BUBBLE_WIDTH / 2 - 12);
    bubbleStyle.top = rect.top - GAP;
    bubbleStyle.transform = 'translate(-50%, -100%)';
  } else if (step.placement === 'bottom') {
    bubbleStyle.left = Math.min(Math.max(cx, BUBBLE_WIDTH / 2 + 12), window.innerWidth - BUBBLE_WIDTH / 2 - 12);
    bubbleStyle.top = rect.bottom + GAP;
    bubbleStyle.transform = 'translateX(-50%)';
  } else if (step.placement === 'left') {
    bubbleStyle.left = rect.left - GAP;
    bubbleStyle.top = Math.min(Math.max(cy, 100), window.innerHeight - 100);
    bubbleStyle.transform = 'translate(-100%, -50%)';
  } else {
    bubbleStyle.left = rect.right + GAP;
    bubbleStyle.top = Math.min(Math.max(cy, 100), window.innerHeight - 100);
    bubbleStyle.transform = 'translateY(-50%)';
  }

  return (
    <div className={styles.overlay} aria-hidden={false} data-tour-overlay>
      <div className={styles.spotlight} style={spotlightStyle} />
      <div className={styles.bubble} style={bubbleStyle}>
        <div className={styles.stepCount}>
          {stepIndex + 1} of {STEPS.length}
        </div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.text}>{step.text}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={finish}>
            Skip
          </button>
          <button type="button" className={styles.next} onClick={next}>
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

