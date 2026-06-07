/** Per-project subfolder section configs (each subfolder = one tab). */

export const PROJECT_SECTION_CONFIG = {
  '01-fluidai': {
    overview:
      'Brand identity, UI screens, motion, and merchandise for Fluid AI — a Web3 liquidity platform built with Tandem Digital.',
    sections: [
      { id: 'brand-identity', slug: 'rebranding', label: 'Brand Identity', maxImages: 24 },
      { id: 'ui-screens', slug: 'infographics', label: 'UI Screens', maxImages: 24 },
      { id: 'motion', slug: 'social-posts', label: 'Motion', maxImages: 24, videoKeys: ['fluid-animation-study'] },
      { id: 'merch', slug: 'merchandise', label: 'Merch', maxImages: 24 },
    ],
  },
  '03-marriott-aloft': {
    overview: 'Environmental branding and artwork for Marriott, Sheraton, and Aloft properties.',
    sections: [
      { id: 'artwork', slug: 'Artwork', label: 'Artwork', maxImages: 24 },
      { id: 'other', slug: 'Other', label: 'Other', maxImages: 24 },
    ],
  },
  '05-social-media': {
    overview: 'Social media design across food, retail, and lifestyle brands.',
    sections: [
      { id: 'big-mamas', slug: 'Big Mamas', label: 'Big Mamas', maxImages: 24 },
      { id: 'devils-row', slug: 'devils-row-gin', label: 'Devils Row', maxImages: 24 },
      { id: 'liberty-ladders', slug: 'Liberty Ladders', label: 'Liberty Ladders', maxImages: 24 },
      { id: 'mistins', slug: 'Mistins', label: 'Mistins', maxImages: 24 },
      { id: 'qmart', slug: 'qmart', label: 'QMart', maxImages: 24 },
      { id: 'other', slug: 'Other', label: 'Other', maxImages: 24 },
    ],
  },
  '06-branding': {
    overview: 'Brand identity systems, packaging, and campaign visuals for consumer brands.',
    sections: [
      { id: 'sampoorna', slug: 'Sampoorna Supermarket', label: 'Sampoorna Supermarket', maxImages: 24 },
      { id: 'step-set-go', slug: 'Step-Set-Go', label: 'Step-Set-Go', maxImages: 24 },
      { id: 'truearte', slug: 'Truearte', label: 'Truearte', maxImages: 24 },
      { id: 'other', slug: 'Other', label: 'Other', maxImages: 24 },
    ],
  },
  '07-web-ui': {
    overview: 'Web and product UI design for e-commerce and service brands.',
    sections: [
      { id: 'big-mamas', slug: 'Big Mamas', label: 'Big Mamas', maxImages: 24 },
      { id: 'cancelled-plans', slug: 'Cancelled Plans', label: 'Cancelled Plans', maxImages: 24 },
      { id: 'liberty-ladders', slug: 'Liberty Ladders', label: 'Liberty Ladders', maxImages: 24 },
      { id: 'tahini', slug: 'Tahini', label: 'Tahini', maxImages: 24 },
      { id: 'trueherb', slug: 'TrueHerb', label: 'TrueHerb', maxImages: 24 },
      { id: 'other', slug: 'Other', label: 'Other', maxImages: 24 },
    ],
  },
  '08-print-info': {
    overview: 'Print design, infographics, and information graphics.',
    sections: [
      { id: 'covid-safety', slug: 'Covid Safety', label: 'Covid Safety', maxImages: 24 },
      { id: 'marriott', slug: 'Marriott', label: 'Marriott', maxImages: 24 },
      { id: 'other', slug: 'Other', label: 'Other', maxImages: 24 },
    ],
  },
};

import { MOTION_REEL_VIDEO_KEYS } from './cloudinaryVideos.js';

export const MOTION_VIDEO_CONFIG = {
  folder: '09-motion',
  overview: 'Motion graphics and animated content across campaigns and social.',
  videoSubfolders: [],
  maxVideosPerPath: 0,
  videoKeys: MOTION_REEL_VIDEO_KEYS,
};

export function getProjectSectionConfig(folder) {
  return PROJECT_SECTION_CONFIG[folder] ?? null;
}

export function isMotionProject(folder) {
  return folder === MOTION_VIDEO_CONFIG.folder;
}
