// A project has a real address: /work/<slug> (each one pre-rendered at build
// time with its own title and text, scripts/prerender.mjs). The older
// #/work/<slug> links still land on the project.

const PATH = /^\/work\/([\w-]+)\/?$/;
const HASH = /^#\/work\/([\w-]+)/;
const SITE_TITLE = 'Kenneth Nathanael, Designer';

/** The project slug in the address, or null. */
export function workSlugFromUrl() {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(PATH) || window.location.hash.match(HASH);
  return m ? m[1] : null;
}

/** Put a project in the address (a new history entry), or take it out. */
export function pushWork(slug, name) {
  window.history.pushState({ work: slug }, '', `/work/${slug}`);
  document.title = name ? `${name}, Kenneth Nathanael` : SITE_TITLE;
}

export function clearWork() {
  window.history.replaceState(null, '', `/${window.location.search}`);
  document.title = SITE_TITLE;
}

export function titleFor(name) {
  document.title = name ? `${name}, Kenneth Nathanael` : SITE_TITLE;
}
