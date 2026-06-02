import { useMemo, useState } from 'react';
import { FINDER_CATEGORIES, getProjectsByCategory } from '../../../data/projects.js';
import { useOS } from '../../../context/OSContext.jsx';
import FinderFolderIcon from '../../icons/FinderFolderIcon.jsx';
import {
  IconHeart,
  IconFolder,
  IconChevronLeft,
  IconChevronRight,
  IconGridView,
  IconListView,
  IconSearch,
} from '../../icons/FinderSidebarIcons.jsx';
import styles from './Finder.module.css';

const LOCATIONS = [{ id: 'portfolio', label: 'Portfolio' }];

export default function Finder() {
  const { openProject } = useOS();
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('icons');
  const [history, setHistory] = useState(['all']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeLocation, setActiveLocation] = useState(false);

  const goBack = () => {
    if (historyIndex <= 0) return;
    const next = historyIndex - 1;
    const cat = history[next];
    setHistoryIndex(next);
    setCategory(cat);
    setActiveLocation(cat === 'all' && next === 0);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const next = historyIndex + 1;
    const cat = history[next];
    setHistoryIndex(next);
    setCategory(cat);
    setActiveLocation(false);
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const filtered = useMemo(() => {
    let list = getProjectsByCategory(category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, search]);

  const openProjectItem = (project) => {
    setSelectedId(project.id);
    openProject(project.id);
  };

  const selectCategory = (catId, fromLocation = false) => {
    setActiveLocation(fromLocation);
    setCategory(catId);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      if (trimmed[trimmed.length - 1] === catId) return trimmed;
      const next = [...trimmed, catId];
      setHistoryIndex(next.length - 1);
      return next;
    });
  };

  return (
    <div className={styles.finder}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSection}>Favourites</div>
        {FINDER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.sidebarItem} ${category === cat.id && !activeLocation ? styles.sidebarItemActive : ''}`}
            onClick={() => selectCategory(cat.id, false)}
          >
            <IconHeart className={styles.sidebarIcon} />
            <span>{cat.label}</span>
          </button>
        ))}
        <div className={styles.sidebarDivider} />
        <div className={styles.sidebarSection}>Locations</div>
        {LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            type="button"
            className={`${styles.sidebarItem} ${category === 'all' && activeLocation ? styles.sidebarItemActive : ''}`}
            onClick={() => selectCategory('all', true)}
          >
            <IconFolder className={styles.sidebarIcon} />
            <span>{loc.label}</span>
          </button>
        ))}
      </aside>
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.nav}>
              <button
                type="button"
                className={styles.toolBtn}
                disabled={!canGoBack}
                onClick={goBack}
                aria-label="Back"
              >
                <IconChevronLeft className={styles.toolIcon} />
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                disabled={!canGoForward}
                onClick={goForward}
                aria-label="Forward"
              >
                <IconChevronRight className={styles.toolIcon} />
              </button>
            </div>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.toolBtn} ${view === 'icons' ? styles.toolBtnActive : ''}`}
                onClick={() => setView('icons')}
                aria-label="Icon view"
              >
                <IconGridView className={styles.toolIcon} />
              </button>
              <button
                type="button"
                className={`${styles.toolBtn} ${view === 'list' ? styles.toolBtnActive : ''}`}
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <IconListView className={styles.toolIcon} />
              </button>
            </div>
          </div>
          <div className={styles.searchWrap}>
            <IconSearch className={styles.searchIcon} />
            <input
              type="search"
              className={styles.search}
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.content}>
          <div className={view === 'list' ? styles.list : styles.grid}>
            {filtered.map((project) => (
              <button
                key={project.id}
                type="button"
                className={`${styles.item} ${selectedId === project.id ? styles.itemSelected : ''}`}
                onClick={() => setSelectedId(project.id)}
                onDoubleClick={() => openProjectItem(project)}
              >
                <span className={styles.folderGraphic}>
                  <FinderFolderIcon size={64} />
                </span>
                <span className={styles.itemLabel}>{project.name}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
