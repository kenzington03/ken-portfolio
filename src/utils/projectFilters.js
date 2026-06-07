import { MILESTONE_CAMPAIGNS } from '../data/milestoneCampaigns.js';

/** All tags associated with a project (project-level + section-level for Milestone). */
export function getProjectAllTags(project) {
  const tags = new Set(project.tags ?? []);
  if (project.slug === 'milestone') {
    MILESTONE_CAMPAIGNS.forEach((section) => {
      (section.tags ?? []).forEach((t) => tags.add(t));
    });
  }
  return [...tags];
}

export function projectMatchesFilters(project, { projectSlugs = [], categoryTags = [], search = '' }) {
  if (search.trim()) {
    const q = search.toLowerCase();
    const haystack = [project.name, project.client, project.category, ...getProjectAllTags(project)]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (projectSlugs.length > 0 && !projectSlugs.includes(project.slug)) {
    return false;
  }

  if (categoryTags.length > 0) {
    const tags = getProjectAllTags(project);
    const matches = categoryTags.some((t) => tags.includes(t));
    if (!matches) return false;
  }

  return true;
}

export function filterProjects(projects, filters) {
  return projects.filter((p) => projectMatchesFilters(p, filters));
}
