import { useEffect, useMemo, useRef, useState } from 'react';
import { projects } from '../../data/projects.js';
import { getTagLabel } from '../../data/tags.js';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { useOS } from '../../context/OSContext.jsx';
import styles from './Spotlight.module.css';

function matchProjects(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return projects
    .map((project) => {
      const nameMatch = project.name.toLowerCase().includes(q);
      const tagMatches = (project.tags ?? []).filter((tag) =>
        getTagLabel(tag).toLowerCase().includes(q)
      );
      if (!nameMatch && tagMatches.length === 0) return null;
      return { project, tagMatches };
    })
    .filter(Boolean)
    .slice(0, 8);
}

export default function Spotlight({ open, onClose }) {
  const { openProject } = useOS();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const results = useMemo(() => matchProjects(query), [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const openResult = (project, e) => {
    openProject(project.id, { animationOrigin: getOriginFromEvent(e) });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
      >
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search"
        />
        {results.length > 0 && (
          <ul className={styles.results}>
            {results.map(({ project, tagMatches }) => (
              <li key={project.id}>
                <button
                  type="button"
                  className={styles.resultBtn}
                  onClick={(e) => openResult(project, e)}
                >
                  <span className={styles.resultName}>{project.name}</span>
                  <span className={styles.resultTags}>
                    {(tagMatches.length > 0 ? tagMatches : project.tags ?? [])
                      .slice(0, 3)
                      .map((tag) => getTagLabel(tag))
                      .join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query && results.length === 0 && (
          <p className={styles.empty}>No projects found</p>
        )}
      </div>
    </div>
  );
}
