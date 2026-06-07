export const CATEGORY_TAGS = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'branding', label: 'Branding' },
  { id: 'social', label: 'Social Media' },
  { id: 'motion', label: 'Motion' },
  { id: 'print', label: 'Print' },
  { id: 'ui-ux', label: 'UI/UX' },
  { id: 'events', label: 'Events' },
  { id: 'illustration', label: 'Illustration' },
];

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
