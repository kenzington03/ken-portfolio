// Helpers shared by the v1 (<Intro>) and v2 (<Intro2>) scroll intros.

import { Component } from 'react';
import { ease } from './introTimeline.js';

export const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Can this browser draw the 3D scene? Probe only: the context is handed back
    so it doesn't count against the browser's live-context cap. */
export function hasWebGL2() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/** Renders nothing once the 3D scene throws, and tells the intro to go flat. */
export class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/**
 * Tween window scroll; any real user input interrupts it (the user takes
 * over, so `onDone` still fires). Returns a silent cancel fn for cleanup.
 */
export function tweenScroll(to, ms, onDone) {
  const from = window.scrollY;
  const start = performance.now();
  let raf = 0;
  const cancel = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('wheel', interrupt);
    window.removeEventListener('touchstart', interrupt);
    window.removeEventListener('keydown', interrupt);
  };
  const interrupt = () => {
    cancel();
    onDone?.();
  };
  window.addEventListener('wheel', interrupt, { passive: true });
  window.addEventListener('touchstart', interrupt, { passive: true });
  window.addEventListener('keydown', interrupt);
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    window.scrollTo(0, from + (to - from) * ease(k));
    if (k < 1) raf = requestAnimationFrame(step);
    else interrupt();
  };
  raf = requestAnimationFrame(step);
  return cancel;
}

/* Phosphor-style arrows, stroke 1.75, so both CTAs share one icon language. */
export const ArrowDown = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
  </svg>
);
export const ArrowRight = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
  </svg>
);
