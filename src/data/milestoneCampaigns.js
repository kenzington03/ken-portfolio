import {
  MILESTONE_MOMENTUM_VIDEO_KEYS,
  MILESTONE_SERVICENOW_VIDEO_KEYS,
  MOMENTUM_2026_HERO_VIDEO,
} from './cloudinaryVideos.js';

export const MILESTONE_BASE = '/assets/projects/02-milestone';
export const MILESTONE_LOGO = `${MILESTONE_BASE}/logo.png`;

export const MILESTONE_OVERVIEW =
  'Milestone Technologies is a global IT services and solutions provider. As Design Lead, I lead brand campaigns across LinkedIn, print, events, and digital — from ServiceNow and Salesforce initiatives to internal comms and employer branding. Below are 13 campaign streams produced for marketing, HR, and partner teams.';

/** Campaign folders in display order (01 = highest priority) */
export const MILESTONE_CAMPAIGNS = [
  {
    id: '01-momentum-2026',
    slug: '01-momentum-2026',
    label: 'Momentum 2026',
    maxImages: 4,
    heroVideo: MOMENTUM_2026_HERO_VIDEO,
    videoKeys: MILESTONE_MOMENTUM_VIDEO_KEYS,
    tags: ['campaign', 'events', 'motion', 'print'],
  },
  {
    id: '02-servicenow',
    slug: '02-servicenow',
    label: 'ServiceNow',
    maxImages: 16,
    videoKeys: MILESTONE_SERVICENOW_VIDEO_KEYS,
    tags: ['campaign', 'social', 'motion', 'print'],
  },
  {
    id: '03-it-disruption',
    slug: '03-it-disruption',
    label: 'IT Disruption Campaign',
    maxImages: 7,
    maxVideos: 0,
    tags: ['campaign', 'social', 'print'],
  },
  {
    id: '04-salesforce-dreamforce',
    slug: '04-salesforce-dreamforce',
    label: 'Salesforce Dreamforce',
    maxImages: 5,
    maxVideos: 0,
    tags: ['campaign', 'events', 'social'],
  },
  {
    id: '05-agentforce',
    slug: '05-agentforce',
    label: 'Agentforce Campaign',
    maxImages: 2,
    maxVideos: 0,
    tags: ['campaign', 'social'],
  },
  {
    id: '06-digital-workplace',
    slug: '06-digital-workplace',
    label: 'Digital Workplace',
    maxImages: 4,
    maxVideos: 0,
    tags: ['campaign', 'print', 'social'],
  },
  {
    id: '07-genai',
    slug: '07-genai',
    label: 'GenAI Emailers',
    maxImages: 2,
    maxVideos: 0,
    tags: ['campaign', 'social', 'motion'],
  },
  {
    id: '08-amgen-partnership',
    slug: '08-amgen-partnership',
    label: 'Amgen Partnership',
    maxImages: 2,
    maxVideos: 0,
    tags: ['campaign', 'branding', 'events'],
  },
  {
    id: '09-orbie-awards',
    slug: '09-orbie-awards',
    label: 'Orbie Awards',
    maxImages: 8,
    maxVideos: 0,
    tags: ['campaign', 'events', 'branding'],
  },
  {
    id: '10-events',
    slug: '10-events',
    label: 'Events',
    maxImages: 3,
    maxVideos: 0,
    tags: ['events', 'print', 'branding'],
  },
  {
    id: '11-branding',
    slug: '11-branding',
    label: 'Branding',
    maxImages: 13,
    maxVideos: 0,
    tags: ['branding', 'print', 'illustration'],
  },
  {
    id: '12-internal-social',
    slug: '12-internal-social',
    label: 'Internal Social',
    maxImages: 6,
    maxVideos: 0,
    tags: ['social', 'campaign', 'branding'],
  },
  {
    id: '13-others',
    slug: '13-others',
    label: 'Others',
    maxImages: 5,
    maxVideos: 0,
    tags: ['campaign', 'print', 'social'],
  },
];

export const MILESTONE_VIDEO_REEL = {
  id: 'video-reel',
  label: 'Video Reel',
  path: 'videos',
  flatMax: 30,
};

/** Nav order: Momentum first, then Video Reel, then remaining campaigns */
export function getMilestoneNavSections(campaigns, videoReelGroups) {
  const momentum = campaigns.find((c) => c.id === '01-momentum-2026');
  const rest = campaigns.filter((c) => c.id !== '01-momentum-2026');
  const hasReel = videoReelGroups.some((g) => g.videos.length > 0);
  const sections = [];
  if (momentum) sections.push({ id: momentum.id, label: momentum.label });
  if (hasReel) sections.push({ id: MILESTONE_VIDEO_REEL.id, label: MILESTONE_VIDEO_REEL.label });
  rest.forEach((c) => sections.push({ id: c.id, label: c.label }));
  return sections;
}
