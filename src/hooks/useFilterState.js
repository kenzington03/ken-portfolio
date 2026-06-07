import { useCallback, useMemo, useState } from 'react';
import { SIDEBAR_TAG_MAP } from '../data/tags.js';

export function useFilterState() {
  const [projectFilters, setProjectFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [activeSidebarId, setActiveSidebarId] = useState('all');

  const toggleProjectFilter = useCallback((slug) => {
    setProjectFilters((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const toggleCategoryFilter = useCallback((tagId) => {
    setCategoryFilters((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
    setActiveSidebarId(null);
  }, []);

  const removeProjectFilter = useCallback((slug) => {
    setProjectFilters((prev) => prev.filter((s) => s !== slug));
  }, []);

  const removeCategoryFilter = useCallback((tagId) => {
    setCategoryFilters((prev) => prev.filter((t) => t !== tagId));
  }, []);

  const clearAllFilters = useCallback(() => {
    setProjectFilters([]);
    setCategoryFilters([]);
    setActiveSidebarId('all');
  }, []);

  const applySidebarFilter = useCallback((sidebarId) => {
    setActiveSidebarId(sidebarId);
    if (sidebarId === 'all') {
      setCategoryFilters([]);
      return;
    }
    const tag = SIDEBAR_TAG_MAP[sidebarId];
    if (tag) {
      setCategoryFilters([tag]);
    }
  }, []);

  const filterState = useMemo(
    () => ({ projectSlugs: projectFilters, categoryTags: categoryFilters }),
    [projectFilters, categoryFilters]
  );

  return {
    projectFilters,
    categoryFilters,
    activeSidebarId,
    filterState,
    toggleProjectFilter,
    toggleCategoryFilter,
    removeProjectFilter,
    removeCategoryFilter,
    clearAllFilters,
    applySidebarFilter,
    setCategoryFilters,
  };
}
