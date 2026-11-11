import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BEST_WORK } from '../../../data/bestWork.js';
import { getProjectById } from '../../../data/projects.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import { useOS } from '../../../context/OSContext.jsx';
import Lightbox from '../../Media/Lightbox.jsx';
import styles from './BestWorkViewer.module.css';

// Every piece, in order, so the big view steps through all of them.
const ALL = BEST_WORK.flatMap((w) => w.pieces.map((p) => ({ type: 'image', src: p.src })));
const startOf = BEST_WORK.map((_, i) => BEST_WORK.slice(0, i).reduce((n, w) => n + w.pieces.length, 0));

const SPRING = { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 };

/** Best Work, in the poster's language (paper, navy ink, tomato): five
 *  ideas, each a lead piece and the pieces that show it holds. */
export default function BestWorkViewer({ project }) {
  const { openProject } = useOS();
  const [open, setOpen] = useState(null);
  const scroller = useRef(null);

  return (
    <div className={styles.viewer}>
      <div ref={scroller} className={styles.scroll}>
        <header className={styles.header}>
          <p className={styles.kicker}>Start here</p>
          <h1 className={styles.title}>{project.name}</h1>
          <p className={styles.lede}>{project.description}</p>
        </header>
        <ol className={styles.list}>
          {BEST_WORK.map((w, i) => {
            const [lead, ...rest] = w.pieces;
            return (
              <motion.li
                key={w.title}
                className={`${styles.entry} ${i % 2 ? styles.flip : ''} ${rest.length ? '' : styles.solo}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ root: scroller, once: true, amount: 0.25 }}
                transition={{ ...SPRING, delay: i === 0 ? 0.15 : 0 }}
              >
                <div className={styles.words} data-cat-surface>
                  <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                  <h2 className={styles.name}>{w.title}</h2>
                  <p className={styles.meta}>
                    {w.client} · {w.kind}
                  </p>
                  <p className={styles.line}>{w.line}</p>
                  <button
                    type="button"
                    className={styles.more}
                    onClick={(e) => openProject(w.projectId, { animationOrigin: getOriginFromEvent(e) })}
                  >
                    See all of {getProjectById(w.projectId)?.name} <span aria-hidden>→</span>
                  </button>
                </div>
                <div className={styles.art}>
                  <motion.button
                    type="button"
                    className={styles.lead}
                    onClick={() => setOpen(startOf[i])}
                    whileHover={{ y: -6, rotate: i % 2 ? 0.6 : -0.6 }}
                    transition={SPRING}
                    data-cat-surface
                  >
                    <img src={lead.src} alt={lead.alt} loading={i < 2 ? 'eager' : 'lazy'} />
                  </motion.button>
                  {rest.length > 0 && (
                    <div className={styles.rest}>
                      {rest.map((p, k) => (
                        <motion.button
                          key={p.src}
                          type="button"
                          className={styles.thumb}
                          onClick={() => setOpen(startOf[i] + k + 1)}
                          initial={{ opacity: 0, y: 24 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ root: scroller, once: true, amount: 0.3 }}
                          whileHover={{ y: -4 }}
                          transition={{ ...SPRING, delay: 0.12 + k * 0.08 }}
                          data-cat-surface
                        >
                          <img src={p.src} alt={p.alt} loading="lazy" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
      <Lightbox items={ALL} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}
