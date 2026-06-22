import { SIDEBAR_TAG_MAP } from './tags.js';
import { filterProjects } from '../utils/projectFilters.js';

export const FINDER_CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'brand-identity', label: 'Brand & Identity' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'ui-ux', label: 'UI/UX' },
  { id: 'motion', label: 'Motion' },
  { id: 'print-packaging', label: 'Print & Packaging' },
  { id: 'concept', label: 'Concept Work' },
];

export const projects = [
  {
    id: 1,
    slug: 'fluid-ai',
    name: 'Fluid AI',
    category: 'Brand Identity + UI',
    client: 'Tandem Digital',
    year: '2023',
    folder: '01-fluidai',
    logo: '/assets/projects/01-fluidai/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-fluidai.jpeg',
    tags: ['branding', 'ui-ux', 'motion', 'campaign'],
    description: '[ placeholder ]',
    dateModified: '2023-09-15',
  },
  {
    id: 2,
    slug: 'milestone',
    name: 'Milestone Technologies',
    category: 'Brand Campaign',
    client: 'Milestone Technologies',
    year: '2024',
    folder: '02-milestone',
    logo: '/assets/projects/02-milestone/logo.png',
    cover: '/assets/projects/02-milestone/01-momentum-2026/cover.jpg',
    tags: ['campaign', 'branding', 'social', 'print', 'motion', 'events'],
    description:
      'End-to-end campaign design across 13 streams — ServiceNow, Salesforce Dreamforce, GenAI emailers, employer branding, events, and internal social.',
    dateModified: '2024-11-20',
  },
  {
    id: 3,
    slug: 'marriott',
    name: 'Marriott Hotels',
    category: 'Environmental Branding',
    client: 'Marriott / Sheraton / Aloft',
    year: '2022',
    folder: '03-marriott-aloft',
    logo: '/assets/projects/03-marriott-aloft/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-mariott.jpeg',
    tags: ['branding', 'print', 'illustration', 'events'],
    description: '[ placeholder ]',
    dateModified: '2022-06-10',
  },
  {
    id: 4,
    slug: 'lebron-nike',
    name: 'LeBron x Nike',
    category: 'Concept Design',
    client: 'Personal Project',
    year: '2023',
    folder: '04-lebron-nike',
    logo: '/assets/projects/04-lebron-nike/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-lebron-nike.jpg',
    tags: ['concept', 'ui-ux', 'branding'],
    description: '[ placeholder ]',
    dateModified: '2023-04-22',
  },
  {
    id: 5,
    slug: 'social-media',
    name: 'Social Media',
    category: 'Social Media Design',
    client: 'Various',
    year: '2024',
    folder: '05-social-media',
    logo: '/assets/projects/05-social-media/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-social-media.jpeg',
    tags: ['social', 'campaign', 'motion'],
    description: '[ placeholder ]',
    dateModified: '2024-03-08',
  },
  {
    id: 6,
    slug: 'branding',
    name: 'Branding',
    category: 'Brand Identity',
    client: 'Various',
    year: '2023',
    folder: '06-branding',
    logo: '/assets/projects/06-branding/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-branding.jpg',
    tags: ['branding', 'print', 'illustration'],
    description: '[ placeholder ]',
    dateModified: '2023-07-14',
  },
  {
    id: 7,
    slug: 'web-ui',
    name: 'Web + UI',
    category: 'UI/UX Design',
    client: 'Various',
    year: '2023',
    folder: '07-web-ui',
    logo: '/assets/projects/07-web-ui/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-web+ui.jpg',
    tags: ['ui-ux', 'branding'],
    description: '[ placeholder ]',
    dateModified: '2023-05-30',
  },
  {
    id: 8,
    slug: 'print-info',
    name: 'Print + Info',
    category: 'Print Design',
    client: 'Various',
    year: '2023',
    folder: '08-print-info',
    logo: '/assets/projects/08-print-info/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-print-info.jpg',
    tags: ['print', 'illustration', 'branding'],
    description: '[ placeholder ]',
    dateModified: '2023-02-18',
  },
  {
    id: 9,
    slug: 'motion',
    name: 'Motion',
    category: 'Motion Graphics',
    client: 'Various',
    year: '2023',
    folder: '09-motion',
    logo: '/assets/projects/09-motion/cover.jpg',
    cover: '/assets/projects/hero%20images/hero-motion.jpg',
    tags: ['motion', 'campaign', 'social'],
    description: '[ placeholder ]',
    dateModified: '2023-10-05',
  },
];

export function getProjectById(id) {
  return projects.find((p) => p.id === id || p.id === Number(id));
}

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}

export function getProjectsByCategory(categoryId) {
  if (categoryId === 'all') return projects;
  const tag = SIDEBAR_TAG_MAP[categoryId];
  if (!tag) return projects;
  return filterProjects(projects, { categoryTags: [tag] });
}

export function getNextProject(currentId) {
  const idx = projects.findIndex((p) => p.id === currentId || p.id === Number(currentId));
  if (idx === -1) return projects[0];
  return projects[(idx + 1) % projects.length];
}

export function getProjectCoverUrl(project) {
  return project.cover ?? `/assets/projects/${project.folder}/cover.jpg`;
}

export function getProjectLogoUrl(project) {
  return project.logo ?? getProjectCoverUrl(project);
}
