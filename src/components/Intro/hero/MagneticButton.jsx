// Magnetic Button — after Hirael's (MIT, Mohammad Shehadeh) 21st.dev
// component: pulls toward the cursor, springs back on leave. The label
// drifts a little further than the pill, which gives it depth.

import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const SPRING = { stiffness: 200, damping: 15, mass: 0.1 };

export default function MagneticButton({ strength = 0.35, className, children, ...props }) {
  const reduced = useReducedMotion();
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const innerX = useTransform(x, (v) => v * 0.45);
  const innerY = useTransform(y, (v) => v * 0.45);

  const onPointerMove = (e) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      type="button"
      className={className}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <motion.span style={{ x: innerX, y: innerY, display: 'inline-flex', alignItems: 'center', gap: 'inherit' }}>
        {children}
      </motion.span>
    </motion.button>
  );
}
