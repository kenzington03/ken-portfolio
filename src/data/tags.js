export const CATEGORY_TAGS = [
  { id: 'campaign', label: 'Campaign', color: 'var(--sys-orange)' },
  { id: 'branding', label: 'Branding', color: 'var(--sys-purple)' },
  { id: 'social', label: 'Social Media', color: 'var(--sys-pink)' },
  { id: 'motion', label: 'Motion', color: 'var(--sys-indigo)' },
  { id: 'print', label: 'Print', color: 'var(--sys-teal)' },
  { id: 'ui-ux', label: 'UI/UX', color: 'var(--sys-blue)' },
  { id: 'events', label: 'Events', color: 'var(--sys-yellow)' },
  { id: 'illustration', label: 'Illustration', color: 'var(--sys-green)' },
];

const DEFAULT_TAG_COLOR = 'var(--sys-blue)';

export function getTagColor(tagId) {
  const found = CATEGORY_TAGS.find((t) => t.id === tagId);
  if (found) return found.color;
  if (tagId === CONCEPT_TAG) return 'var(--sys-red)';
  return DEFAULT_TAG_COLOR;
}

export const SIDEBAR_TAG_MAP = {
  'brand-identity': 'branding',
  campaigns: 'campaign',
  'ui-ux': 'ui-ux',
  motion: 'motion',
  'print-packaging': 'print',
  concept: 'concept',
};

/** Sidebar-only tag — not in CATEGORY_TAGS filter UI but used for concept work */
export const CONCEPT_TAG = 'concept';

export function getTagLabel(tagId) {
  const found = CATEGORY_TAGS.find((t) => t.id === tagId);
  if (found) return found.label;
  if (tagId === CONCEPT_TAG) return 'Concept';
  return tagId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getProjectTagLabels(project) {
  return (project.tags ?? []).map(getTagLabel);
}
