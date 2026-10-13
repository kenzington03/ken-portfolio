// The hinge between "about me" and "the work": a single line that tells the
// visitor what is about to happen, while the room fades up behind it.

import { forwardRef } from 'react';
import styles from '../Intro3.module.css';

const Bridge = forwardRef(function Bridge({ flat, onOpen }, ref) {
  return (
    <section id="bridge" ref={ref} className={styles.bridge} aria-label="Open the Mac">
      <div className={styles.bridgeInner}>
        <p className={styles.bridgeLine}>
          My work lives
          <br />
          on a computer.
        </p>
        <p className={styles.bridgeSub}>{flat ? 'Open it.' : 'Keep scrolling. It opens.'}</p>
        {flat && (
          <button type="button" className={styles.bridgeBtn} onClick={onOpen}>
            Open Ken&apos;s Mac
          </button>
        )}
      </div>
    </section>
  );
});

export default Bridge;
