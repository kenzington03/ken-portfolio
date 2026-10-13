// Get to know me: one line per beat, pinned. Words develop from grey to ink
// as you scroll, like a print coming up in the tray. A thin counter on the
// left tracks which line you're on.

import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { STORY } from '../../data/about.js';
import styles from './Intro4.module.css';

function Word({ progress, range, children }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className={styles.storyWord}>
      {children}{' '}
    </motion.span>
  );
}

function Line({ text, index, total, progress }) {
  const start = index / total;
  const end = (index + 1) / total;
  const first = index === 0;
  const last = index === total - 1;
  const opacity = useTransform(
    progress,
    first ? [0, end - 0.04, end] : [start - 0.02, start + 0.03, end - 0.04, end],
    first ? [1, 1, 0] : [0, 1, 1, last ? 1 : 0],
  );
  const y = useTransform(progress, first ? [0, end - 0.04, end] : [start - 0.02, start + 0.03, end - 0.04, end], first ? [0, 0, -30] : [30, 0, 0, last ? 0 : -30]);
  const words = text.split(' ');
  const span = (end - start) * 0.6;
  return (
    <motion.p className={styles.storyLine} style={{ opacity, y }}>
      {words.map((w, i) => (
        <Word
          key={`${w}-${i}`}
          progress={progress}
          range={[start + (span * i) / words.length, start + (span * (i + 1)) / words.length + 0.01]}
        >
          {w}
        </Word>
      ))}
    </motion.p>
  );
}

export default function Story() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [n, setN] = useState(1);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(STORY.length, Math.floor(v * STORY.length) + 1);
    setN((cur) => (cur === next ? cur : next));
  });
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="story" ref={ref} className={styles.story} style={{ '--lines': STORY.length }} aria-label="About Ken">
      <div className={styles.storySticky}>
        <div className={styles.storyMeta} aria-hidden>
          <span className={styles.storyCount}>
            {String(n).padStart(2, '0')}
            <small>/{String(STORY.length).padStart(2, '0')}</small>
          </span>
          <span className={styles.storyBar}>
            <motion.span style={{ scaleY: bar }} />
          </span>
        </div>
        {STORY.map((text, i) => (
          <Line key={text} text={text} index={i} total={STORY.length} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
