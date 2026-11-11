import { useState } from 'react';
import { BEST_WORK } from '../../../data/bestWork.js';
import { getProjectById } from '../../../data/projects.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import { useOS } from '../../../context/OSContext.jsx';
import Lightbox from '../../Media/Lightbox.jsx';
import styles from './BestWorkViewer.module.css';

/** Best Work: the pieces to see first, big, each saying where it is from,
 *  with a way into that project. */
export default function BestWorkViewer({ project }) {
  const { openProject } = useOS();
  const [open, setOpen] = useState(null);
  const items = BEST_WORK.map((w) => ({ type: 'image', src: w.src }));

  return (
    <div className={styles.viewer}>
      <div className={styles.scroll}>
        <header className={styles.header}>
          <h1 className={styles.title}>{project.name}</h1>
          <p className={styles.lede}>{project.description}</p>
        </header>
        <ol className={styles.grid}>
          {BEST_WORK.map((w, i) => (
            <li key={w.src} className={styles.piece} data-cat-surface>
              <button type="button" className={styles.frame} onClick={() => setOpen(i)}>
                <img src={w.src} alt={w.alt} loading={i < 4 ? 'eager' : 'lazy'} />
              </button>
              <div className={styles.caption}>
                <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.what}>
                  <b>{w.title}</b>
                  <span>
                    {w.client} · {w.kind}
                  </span>
                  <button
                    type="button"
                    className={styles.more}
                    onClick={(e) => openProject(w.projectId, { animationOrigin: getOriginFromEvent(e) })}
                  >
                    See {getProjectById(w.projectId)?.name} →
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </div>
  );
}
