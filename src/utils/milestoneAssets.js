import {
  MILESTONE_BASE,
  MILESTONE_CAMPAIGNS,
  MILESTONE_LOGO,
} from '../data/milestoneCampaigns.js';
import { MILESTONE_REEL_VIDEO_KEYS, resolveVideoKeys } from '../data/cloudinaryVideos.js';

const IMAGE_EXT = ['jpg', 'png', 'jpeg', 'webp'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function probeImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function probeFirstExisting(urls) {
  for (const url of urls) {
    if (await probeImage(url)) return url;
  }
  return null;
}

async function loadCampaignImages(slug, maxImages) {
  const base = `${MILESTONE_BASE}/${slug}`;
  const images = [];

  const cover = await probeFirstExisting([`${base}/cover.jpg`, `${base}/cover.png`]);
  if (cover) images.push(cover);

  for (let i = 1; i <= maxImages; i += 1) {
    const num = pad(i);
    const found = await probeFirstExisting(IMAGE_EXT.map((ext) => `${base}/${num}.${ext}`));
    if (found) images.push(found);
  }

  return images;
}

function loadCampaignVideos(campaign) {
  if (campaign.videoKeys?.length) {
    return resolveVideoKeys(campaign.videoKeys);
  }
  return [];
}

function loadVideoReelGroups() {
  const videos = resolveVideoKeys(MILESTONE_REEL_VIDEO_KEYS);
  if (videos.length === 0) return [];
  return [
    {
      id: 'highlights',
      label: 'Highlights',
      videos,
    },
  ];
}

export async function loadMilestoneProject() {
  const logoOk = await probeImage(MILESTONE_LOGO);

  const campaigns = await Promise.all(
    MILESTONE_CAMPAIGNS.map(async (campaign) => {
      const images = await loadCampaignImages(campaign.slug, campaign.maxImages);
      const videos = loadCampaignVideos(campaign);
      return {
        ...campaign,
        images,
        videos,
      };
    })
  );

  const videoReelGroups = loadVideoReelGroups();

  return {
    logo: logoOk ? MILESTONE_LOGO : null,
    campaigns,
    videoReelGroups,
  };
}
