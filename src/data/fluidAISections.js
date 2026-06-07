/** Fluid AI section tabs — maps image URL path segments to sections. */
export const FLUID_AI_SECTIONS = [
  {
    id: 'brand-identity',
    label: 'Brand Identity',
    match: (src) => src.includes('/rebranding/'),
  },
  {
    id: 'ui-screens',
    label: 'UI Screens',
    match: (src) => src.includes('/infographics/'),
  },
  {
    id: 'motion',
    label: 'Motion',
    match: (src) => src.includes('/social-posts/'),
  },
  {
    id: 'merch',
    label: 'Merch',
    match: (src) => src.includes('/merchandise/'),
  },
];

export function groupFluidAIImages(images) {
  const sections = FLUID_AI_SECTIONS.map((s) => ({
    ...s,
    images: images.filter((src) => s.match(src)),
  }));
  return sections.filter((s) => s.images.length > 0);
}
