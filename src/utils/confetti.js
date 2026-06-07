import confetti from 'canvas-confetti';

/** Reusable confetti burst — used by terminal ??? and other easter eggs. */
export function triggerConfetti(durationMs = 3000) {
  const end = Date.now() + durationMs;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#0d9ba8', '#F9A619', '#ffffff', '#00172F'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#0d9ba8', '#F9A619', '#ffffff', '#00172F'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
