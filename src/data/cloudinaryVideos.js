/** Cloudinary-hosted portfolio videos (keys → full URLs). */
export const CLOUDINARY_VIDEOS = {
  'servicenow-loop':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842183/servicenow-loop_rhjyhh.mp4',
  hallifax:
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842175/hallifax_rtyjft.mp4',
  'github-copilot-v1':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842157/github-copilot-v1_hrqqyp.mp4',
  kayak:
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842154/kayak_kpxuu6.mp4',
  'payments-demo':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842150/payments-demo_y9lpje.mp4',
  'momentum-social':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842146/momentum-social_cmllzj.mp4',
  'github-copilot-v3':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842145/github-copilot-v3_v5ujas.mp4',
  'momentum-opening':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842134/momentum-opening_thfldl.mp4',
  'kayak-momentum':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842135/kayak-momentum_lkntx1.mp4',
  'hallifax-2':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842132/hallifax_2_ioiuea.mp4',
  '2025-highlights':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842128/2025-highlights_wparv2.mp4',
  'servicenow-colorblind':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842128/servicenow-colorblind_g6aygf.mp4',
  'fluid-animation-study':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780842116/fluid-animation-study_zx25xd.mp4',
  'lebron-nike-concept':
    'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780841893/lebron-nike-website-concept_xcoubq.mp4',
};

export const FEATURED_VIDEO_KEYS = ['momentum-social', 'servicenow-colorblind'];

/** Momentum 2026 campaign — featured video pinned first. */
export const MILESTONE_MOMENTUM_VIDEO_KEYS = [
  'momentum-social',
  'momentum-opening',
  '2025-highlights',
  'kayak-momentum',
];

/** ServiceNow campaign — featured video pinned first. */
export const MILESTONE_SERVICENOW_VIDEO_KEYS = ['servicenow-colorblind', 'servicenow-loop'];

/** Milestone Video Reel section — remaining showcase clips. */
export const MILESTONE_REEL_VIDEO_KEYS = [
  'hallifax',
  'github-copilot-v1',
  'kayak',
  'payments-demo',
  'github-copilot-v3',
  'hallifax-2',
];

/** 09-motion project — full reel, featured first. */
export const MOTION_REEL_VIDEO_KEYS = [
  'momentum-social',
  'servicenow-colorblind',
  'servicenow-loop',
  'hallifax',
  'github-copilot-v1',
  'kayak',
  'payments-demo',
  'github-copilot-v3',
  'momentum-opening',
  'kayak-momentum',
  'hallifax-2',
  '2025-highlights',
  'fluid-animation-study',
  'lebron-nike-concept',
];

export const FLUID_AI_VIDEO_KEYS = ['fluid-animation-study'];
export const LEBRON_VIDEO_KEYS = ['lebron-nike-concept'];

/** Full-width hero for Momentum 2026 section (not in masonry grid). */
export const MOMENTUM_2026_HERO_VIDEO =
  'https://res.cloudinary.com/dr3fkzgm5/video/upload/q_auto/f_auto/v1780843123/Momentum_2026_mwsihc.mp4';

/** Generate Cloudinary first-frame poster from a video URL. */
export function getCloudinaryPoster(videoUrl) {
  if (!videoUrl?.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) {
    return null;
  }
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,')
    .replace(/f_auto/, 'f_jpg')
    .replace(/\.mp4(\?.*)?$/, '.jpg');
}

export function isVideoKey(value) {
  return typeof value === 'string' && Object.hasOwn(CLOUDINARY_VIDEOS, value);
}

export function buildVideoEntry(key, overrides = {}) {
  const src = CLOUDINARY_VIDEOS[key];
  if (!src) return null;
  return {
    key,
    src,
    poster: overrides.poster ?? getCloudinaryPoster(src) ?? null,
    featured: overrides.featured ?? FEATURED_VIDEO_KEYS.includes(key),
  };
}

/** Resolve an array of Cloudinary keys (or raw URLs) into video objects. */
export function resolveVideoKeys(keys = []) {
  return keys
    .map((entry) => {
      if (typeof entry === 'string') {
        if (isVideoKey(entry)) return buildVideoEntry(entry);
        if (entry.startsWith('http') || entry.startsWith('/')) {
          return {
            src: entry,
            poster: getCloudinaryPoster(entry),
            featured: false,
            key: null,
          };
        }
        return null;
      }
      if (entry?.key) return buildVideoEntry(entry.key, entry);
      if (entry?.src) {
        return {
          src: entry.src,
          poster: entry.poster ?? getCloudinaryPoster(entry.src) ?? null,
          featured: Boolean(entry.featured),
          key: entry.key ?? null,
        };
      }
      return null;
    })
    .filter(Boolean);
}
