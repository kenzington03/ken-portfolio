// "Get to know me": four lines, one per beat, pinned. Each word lights up
// as you scroll, so the story is read at the pace the visitor sets.

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { STORY } from '../../../data/about.js';
import styles from '../Intro3.module.css';

function Word({ progress, range, children }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className={styles.storyWord}>
      {children}{' '}
    </motion.span>
  );
}

function Line({ text, index, total, progress }) {
  const start = index / total;
  const end = (index + 1) / total;
  const last = index === total - 1;
  const first = index === 0;
  // Input offsets must stay inside 0..1 (framer hands them to native scroll timelines).
  const opacity = useTransform(
    progress,
    first ? [0, end - 0.05, end] : [start - 0.03, start + 0.02, end - 0.05, end],
    first ? [1, 1, 0] : [0, 1, 1, last ? 1 : 0],
  );
  const y = useTransform(progress, [end - 0.05, end], [0, last ? 0 : -40]);
  const words = text.split(' ');
  const span = (end - start) * 0.62;
  return (
    <motion.p className={styles.storyLine} style={{ opacity, y }}>
      {words.map((w, i) => {
        const a = start + (span * i) / words.length;
        const b = start + (span * (i + 1)) / words.length + 0.01;
        return (
          <Word key={`${w}-${i}`} progress={progress} range={[a, b]}>
            {w}
          </Word>
        );
      })}
    </motion.p>
  );
}

export default function Story() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <section id="story" ref={ref} className={styles.story} aria-label="About Ken">
      <div className={styles.storySticky}>
        <span className={styles.sectionTag}>01 / About</span>
        {STORY.map((text, i) => (
          <Line key={text} text={text} index={i} total={STORY.length} progress={scrollYProgress} />
        ))}
        <div className={styles.portraitSlot} aria-hidden>
          <span>Still</span>
        </div>
      </div>
    </section>
  );
}
