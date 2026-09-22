import { useCallback, useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { useSeenOnce } from '../../hooks/useSeenOnce.js';
import styles from './OnboardingTour.module.css';

const STEPS = [
  {
    selector: '[data-tour="dock-portfolio"]',
    title: 'Start here',
    text: "This is the Dock — click Portfolio anytime to jump straight into my work.",
    placement: 'top',
  },
  {
    selector: '[data-tour="desktop-icon"]',
    title: 'Rearrange freely',
    text: 'These desktop icons can be dragged anywhere you like — make yourself at home.',
    placement: 'left',
  },
  {
    selector: '[data-tour="menu-achievements"]',
    title: 'Little surprises',
    text: "Explore around and you'll unlock achievements — check progress here.",
    placement: 'bottom',
  },
];

const BUBBLE_WIDTH = 260;
const GAP = 16;
const SPOTLIGHT_PAD = 8;

export default function OnboardingTour() {
  const { helloVisible, clearTourGate } = useOS();
  const [seen, markSeen] = useSeenOnce('onboarding-tour-v1');
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (helloVisible || seen) return undefined;
    const timer = setTimeout(() => setActive(true), 900);
    return () => clearTimeout(timer);
  }, [helloVisible, seen]);

  /* Nothing left to run this session (already seen, or the tour's first
     target never showed up) — release the Portfolio auto-open gate. */
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

  if (!active || seen) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const finish = () => {
    setActive(false);
    markSeen();
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  // Target not (yet) on screen — e.g. covered/unmounted. Don't block the visit.
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
    <div className={styles.overlay} aria-hidden={false}>
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

