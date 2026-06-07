import { useEffect, useRef, useState } from 'react';
import { projects as allProjects } from '../../../data/projects.js';
import { CATEGORY_TAGS, getTagLabel } from '../../../data/tags.js';
import styles from './FilterBar.module.css';

const GRID_PROJECTS = allProjects;

export default function FilterBar({
  projectFilters,
  categoryFilters,
  onToggleProject,
  onToggleCategory,
}) {
  const [openPanel, setOpenPanel] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const togglePanel = (panel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className={styles.dropdowns} ref={barRef}>
      <div className={styles.dropdown}>
        <button
          type="button"
          className={`${styles.dropdownTrigger} ${openPanel === 'project' ? styles.dropdownTriggerOpen : ''}`}
          onClick={() => togglePanel('project')}
          aria-expanded={openPanel === 'project'}
        >
          Project
        </button>
        {openPanel === 'project' && (
          <div className={styles.dropdownMenu}>
            {GRID_PROJECTS.map((p) => (
              <label key={p.slug} className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={projectFilters.includes(p.slug)}
                  onChange={() => onToggleProject(p.slug)}
                />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className={styles.dropdown}>
        <button
          type="button"
          className={`${styles.dropdownTrigger} ${openPanel === 'category' ? styles.dropdownTriggerOpen : ''}`}
          onClick={() => togglePanel('category')}
          aria-expanded={openPanel === 'category'}
        >
          Category
        </button>
        {openPanel === 'category' && (
          <div className={styles.dropdownMenu}>
            {CATEGORY_TAGS.map((tag) => (
              <label key={tag.id} className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={categoryFilters.includes(tag.id)}
                  onChange={() => onToggleCategory(tag.id)}
                />
                <span>{tag.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FilterChips({ projectFilters, categoryFilters, onRemoveProject, onRemoveCategory }) {
  if (projectFilters.length === 0 && categoryFilters.length === 0) return null;

  return (
    <div className={styles.chipsRow}>
      {projectFilters.map((slug) => {
        const p = allProjects.find((x) => x.slug === slug);
        return (
          <span key={slug} className={styles.chip}>
            {p?.name ?? slug}
            <button type="button" onClick={() => onRemoveProject(slug)} aria-label="Remove">
              ×
            </button>
          </span>
        );
      })}
      {categoryFilters.map((tagId) => (
        <span key={tagId} className={styles.chip}>
          {getTagLabel(tagId)}
          <button type="button" onClick={() => onRemoveCategory(tagId)} aria-label="Remove">
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
