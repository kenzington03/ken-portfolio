import {
  buildVideoEntry,
  getCloudinaryPoster,
  isVideoKey,
  resolveVideoKeys,
} from '../data/cloudinaryVideos.js';
import { getSectionManifestImages } from '../data/sectionImageManifest.js';

const IMAGE_EXT = ['jpg', 'png', 'jpeg', 'webp', 'avif', 'gif'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function probeImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/** Supports local paths and absolute URLs (e.g. Cloudinary). */
export function probeVideo(url) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };
    if (url.startsWith('http')) {
      video.crossOrigin = 'anonymous';
    }
    video.onloadeddata = () => {
      cleanup();
      resolve(true);
    };
    video.onerror = () => {
      cleanup();
      resolve(false);
    };
    video.preload = 'metadata';
    video.src = url;
  });
}

async function probeFirstExisting(urls, probeFn = probeImage) {
  for (const url of urls) {
    if (await probeFn(url)) return url;
  }
  return null;
}

export async function loadSectionImages(basePath, slug, maxImages = 24) {
  const folder = basePath.replace(/^\/assets\/projects\//, '');
  const manifestUrls = getSectionManifestImages(folder, slug);
  if (manifestUrls.length > 0) {
    return manifestUrls;
  }

  const base = `${basePath}/${slug.split('/').map(encodeURIComponent).join('/')}`;
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

export async function loadSectionVideos(basePath, slug, maxVideos = 10, poster = null) {
  if (!maxVideos) return [];
  const base = `${basePath}/${slug}`;
  const videos = [];
  const seen = new Set();

  for (let i = 1; i <= maxVideos; i += 1) {
    const found = await probeFirstExisting(
      [`${base}/${pad(i)}.mp4`, `${base}/${i}.mp4`],
      probeVideo
    );
    if (found && !seen.has(found)) {
      seen.add(found);
      videos.push({ src: found, poster });
    }
  }

  return videos;
}

/** Load sections defined in project config (subfolder = tab). */
export async function loadSectionedProject(folder, sections) {
  const basePath = `/assets/projects/${folder}`;
  return Promise.all(
    sections.map(async (section) => {
      const images = await loadSectionImages(basePath, section.slug, section.maxImages ?? 24);
      const poster = images[0] ?? null;
      const keyVideos = resolveVideoKeys(section.videoKeys ?? []);
      const explicitVideos = resolveVideoKeys(section.videos ?? []);
      const probedVideos = section.maxVideos
        ? (await loadSectionVideos(basePath, section.slug, section.maxVideos, poster)).map(
            normalizeVideoEntry
          ).filter(Boolean)
        : [];
      return {
        ...section,
        images,
        videos: [...keyVideos, ...explicitVideos, ...probedVideos],
      };
    })
  );
}

/** Probe mp4 files in project root and optional subfolders (for Motion). */
export async function loadProjectVideoGrid(
  folder,
  subfolderSlugs = [],
  maxPerPath = 30,
  explicitVideos = []
) {
  const basePath = `/assets/projects/${folder}`;
  const seen = new Set();
  const videos = [];

  const addVideo = (entry) => {
    const normalized = normalizeVideoEntry(entry);
    if (!normalized || seen.has(normalized.src)) return;
    seen.add(normalized.src);
    videos.push(normalized);
  };

  (explicitVideos ?? []).forEach(addVideo);

  const probePath = async (prefix) => {
    for (let i = 1; i <= maxPerPath; i += 1) {
      const candidates = [
        `${prefix}/${pad(i)}.mp4`,
        `${prefix}/${i}.mp4`,
        `${prefix}/video-${pad(i)}.mp4`,
      ];
      for (const url of candidates) {
        if (seen.has(url)) continue;
        if (await probeVideo(url)) {
          addVideo({ src: url, poster: null });
        }
      }
    }
  };

  await probePath(basePath);
  for (const slug of subfolderSlugs) {
    await probePath(`${basePath}/${slug}`);
  }

  return videos;
}

/** Normalize video entry — supports Cloudinary keys, URLs, or { src, poster, featured }. */
export function normalizeVideoEntry(video) {
  if (!video) return null;
  if (typeof video === 'string') {
    if (isVideoKey(video)) return buildVideoEntry(video);
    return {
      src: video,
      poster: getCloudinaryPoster(video),
      featured: false,
      key: null,
    };
  }
  if (video.key && !video.src) return buildVideoEntry(video.key, video);
  if (!video.src) return null;
  return {
    src: video.src,
    poster: video.poster ?? getCloudinaryPoster(video.src) ?? null,
    featured: Boolean(video.featured),
    key: video.key ?? null,
  };
}

export function isExternalMediaUrl(url) {
  return typeof url === 'string' && url.startsWith('http');
}
