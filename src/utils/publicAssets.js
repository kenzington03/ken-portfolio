import FILES from '../data/publicAssets.json';

// Every file under public/assets (scripts/asset-manifest.mjs writes the list).
const KNOWN = new Set(FILES);

/** For a local /assets/ path: whether the file exists. Undefined for anything
 *  else (remote URLs), which still has to be probed. */
export function assetExists(url) {
  if (typeof url !== 'string' || !url.startsWith('/assets/')) return undefined;
  try {
    return KNOWN.has(decodeURI(url.split(/[?#]/)[0]));
  } catch {
    return undefined;
  }
}
