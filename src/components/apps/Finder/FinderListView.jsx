import { useMemo, useState } from 'react';
import { getTagLabel } from '../../../data/tags.js';
import FinderFolderIcon from '../../icons/FinderFolderIcon.jsx';
import styles from './FinderListView.module.css';

const FOLDER_ICON = '/icons/desktop-folder.png';

function formatDateModified(project) {
  if (project.dateModified) {
    return new Date(project.dateModified).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return project.year ?? '—';
}

function SortArrow({ active, direction }) {
  if (!active) return <span className={styles.sortArrowMuted}>↕</span>;
  return <span className={styles.sortArrow}>{direction === 'asc' ? '▲' : '▼'}</span>;
}

function RowIcon() {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return <FinderFolderIcon size={16} />;
  }

  return (
    <img
      src={FOLDER_ICON}
      alt=""
      width={16}
      height={16}
      className={styles.folderIcon}
      draggable={false}
      onError={() => setImgFailed(true)}
    />
  );
}

export default function FinderListView({ projects, selectedId, onSelect, onOpenProject }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    const list = [...projects];
    list.sort((a, b) => {
      let av;
      let bv;
      if (sortKey === 'name') {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (sortKey === 'tags') {
        av = (a.tags ?? []).join(',').toLowerCase();
        bv = (b.tags ?? []).join(',').toLowerCase();
      } else {
        av = a.dateModified ?? a.year ?? '';
        bv = b.dateModified ?? b.year ?? '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [projects, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className={styles.listView}>
      <div className={styles.headerRow} role="row">
        <button
          type="button"
          className={`${styles.headerCell} ${styles.colName}`}
          onClick={() => toggleSort('name')}
        >
          Name
          <SortArrow active={sortKey === 'name'} direction={sortDir} />
        </button>
        <button
          type="button"
          className={`${styles.headerCell} ${styles.colTags}`}
          onClick={() => toggleSort('tags')}
        >
          Tags
          <SortArrow active={sortKey === 'tags'} direction={sortDir} />
        </button>
        <button
          type="button"
          className={`${styles.headerCell} ${styles.colDate}`}
          onClick={() => toggleSort('date')}
        >
          Date Modified
          <SortArrow active={sortKey === 'date'} direction={sortDir} />
        </button>
      </div>
      <div className={styles.body}>
        {sorted.map((project) => (
          <button
            key={project.id}
            type="button"
            role="row"
            className={`${styles.row} ${selectedId === project.id ? styles.rowSelected : ''}`}
            onClick={() => onSelect(project.id)}
            onDoubleClick={(e) => onOpenProject(project, e)}
          >
            <span className={`${styles.cell} ${styles.colName}`}>
              <span className={styles.iconWrap} data-animation-origin>
                <RowIcon />
              </span>
              <span className={styles.name}>{project.name}</span>
            </span>
            <span className={`${styles.cell} ${styles.colTags}`}>
              {(project.tags ?? [])
                .slice(0, 3)
                .map((tag) => getTagLabel(tag))
                .join(', ')}
            </span>
            <span className={`${styles.cell} ${styles.colDate}`}>
              {formatDateModified(project)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
