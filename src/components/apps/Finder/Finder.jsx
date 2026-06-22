import { useMemo, useState } from 'react';
import { FINDER_CATEGORIES, projects, getProjectCoverUrl } from '../../../data/projects.js';
import { getTagLabel } from '../../../data/tags.js';
import { filterProjects } from '../../../utils/projectFilters.js';
import { getOriginFromEvent } from '../../../utils/animationOrigin.js';
import {
  IconFolder,
  IconChevronLeft,
  IconChevronRight,
  IconGridView,
  IconListView,
  IconSearch,
} from '../../icons/FinderSidebarIcons.jsx';
import FilterBar, { FilterChips } from './FilterBar.jsx';
import FinderListView from './FinderListView.jsx';
import { useOS } from '../../../context/OSContext.jsx';
import ContactCta from '../../shared/ContactCta.jsx';
import styles from './Finder.module.css';

const LOCATIONS = [{ id: 'portfolio', label: 'Portfolio' }];

export default function Finder() {
  const {
    openProject,
    projectFilters,
    categoryFilters,
    activeSidebarId,
    filterState,
    toggleProjectFilter,
    toggleCategoryFilter,
    removeProjectFilter,
    removeCategoryFilter,
    applySidebarFilter,
  } = useOS();

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [historyIndex, setHistoryIndex] = useState(0);
  const [history, setHistory] = useState(['all']);
  const [activeLocation, setActiveLocation] = useState(true);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const filtered = useMemo(
    () =>
      filterProjects(projects, {
        ...filterState,
        search,
      }),
    [filterState, search]
  );

  const openProjectItem = (project, event) => {
    setSelectedId(project.id);
    openProject(project.id, { animationOrigin: getOriginFromEvent(event) });
  };

  const selectSidebar = (catId, fromLocation = false) => {
    setActiveLocation(fromLocation);
    applySidebarFilter(catId);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      if (trimmed[trimmed.length - 1] === catId) return trimmed;
      const next = [...trimmed, catId];
      setHistoryIndex(next.length - 1);
      return next;
    });
  };

  const isSidebarActive = (catId) => {
    if (catId === 'all') return activeSidebarId === 'all' && activeLocation;
    return activeSidebarId === catId && !activeLocation;
  };

  const hasActiveFilters = projectFilters.length > 0 || categoryFilters.length > 0;

  return (
    <div className={styles.finder}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarSection}>Favourites</div>
        {FINDER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.sidebarItem} ${isSidebarActive(cat.id) ? styles.sidebarItemActive : ''}`}
            onClick={() => selectSidebar(cat.id, false)}
          >
            {cat.label}
          </button>
        ))}
        <div className={styles.sidebarDivider} />
        <div className={styles.sidebarSection}>Locations</div>
        {LOCATIONS.map((loc) => (
          <button
            key={loc.id}
            type="button"
            className={`${styles.sidebarItem} ${isSidebarActive('all') && activeLocation ? styles.sidebarItemActive : ''}`}
            onClick={() => selectSidebar('all', true)}
          >
            <IconFolder className={styles.sidebarIcon} />
            <span>{loc.label}</span>
          </button>
        ))}
      </aside>
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarNav}>
            <button
              type="button"
              className={styles.toolBtn}
              disabled={!canGoBack}
              aria-label="Back"
            >
              <IconChevronLeft className={styles.toolIcon} />
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              disabled={!canGoForward}
              aria-label="Forward"
            >
              <IconChevronRight className={styles.toolIcon} />
            </button>
          </div>
          <div className={styles.toolbarViews}>
            <button
              type="button"
              className={`${styles.toolBtn} ${view === 'grid' ? styles.toolBtnActive : ''}`}
              onClick={() => setView('grid')}
              aria-label="Grid view"
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
          <div className={styles.toolbarRight}>
            <FilterBar
              projectFilters={projectFilters}
              categoryFilters={categoryFilters}
              onToggleProject={toggleProjectFilter}
              onToggleCategory={toggleCategoryFilter}
              onRemoveProject={removeProjectFilter}
              onRemoveCategory={removeCategoryFilter}
            />
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
        </div>
        {hasActiveFilters && (
          <div className={styles.filterStrip}>
            <FilterChips
              projectFilters={projectFilters}
              categoryFilters={categoryFilters}
              onRemoveProject={removeProjectFilter}
              onRemoveCategory={removeCategoryFilter}
            />
          </div>
        )}
        <div className={`${styles.content} ${view === 'list' ? styles.contentList : ''}`}>
          {view === 'list' ? (
            <FinderListView
              projects={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onOpenProject={openProjectItem}
            />
          ) : (
            <div className={styles.projectGrid}>
              {filtered.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`${styles.projectCard} ${selectedId === project.id ? styles.projectCardSelected : ''}`}
                  style={{ '--card-bg': `url("${getProjectCoverUrl(project)}")` }}
                  data-animation-origin
                  onClick={() => setSelectedId(project.id)}
                  onDoubleClick={(e) => openProjectItem(project, e)}
                >
                  <div className={styles.cardOverlay} aria-hidden />
                  <div className={styles.cardBody}>
                    <span className={styles.cardTitle}>{project.name}</span>
                    <div className={styles.cardTags}>
                      {(project.tags ?? []).slice(0, 4).map((tag) => (
                        <span key={tag} className={styles.cardTag}>
                          {getTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <p className={styles.emptyState}>No projects match the current filters.</p>
          )}
        </div>
        <ContactCta />
      </main>
    </div>
  );
}
