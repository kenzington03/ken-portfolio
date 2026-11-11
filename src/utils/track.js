// Vercel Web Analytics + Speed Insights, without the npm packages: both are
// served by Vercel from this site's own origin (/_vercel/...), so they only
// load on the deployed site. Dev and preview builds keep the queue and drop it.
//
// track(name, props) records one custom event (Vercel needs the Pro plan to
// show them; on Hobby they are ignored). Links are tracked on their own (see
// trackLinks): WhatsApp, email, the résumé and the booking page.

const ON = import.meta.env.PROD && typeof window !== 'undefined' && !/^(localhost|127\.|192\.168\.)/.test(window.location.hostname);

function queue(key, q) {
  if (typeof window === 'undefined') return;
  window[key] =
    window[key] ||
    function push(...args) {
      (window[q] = window[q] || []).push(args);
    };
}

function load(src) {
  const s = document.createElement('script');
  s.defer = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Once, at start-up. */
export function startAnalytics() {
  queue('va', 'vaq');
  queue('si', 'siq');
  if (!ON) return;
  load('/_vercel/insights/script.js');
  load('/_vercel/speed-insights/script.js');
  trackLinks();
}

/** One event: a name and a few flat values (strings, numbers, booleans). */
export function track(name, props) {
  try {
    if (!ON) return;
    window.va?.('event', { name, data: props });
  } catch {
    // (analytics never breaks the page)
  }
}

// The links that matter, wherever they are on the site.
const LINKS = [
  [/^https:\/\/wa\.me\//, 'whatsapp_tap'],
  [/^mailto:/, 'email_tap'],
  [/Resume\.pdf$/i, 'resume_download'],
  [/^https:\/\/cal\.com\//, 'cal_open'],
];

function trackLinks() {
  document.addEventListener(
    'click',
    (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      const hit = LINKS.find(([re]) => re.test(href));
      if (!hit) return;
      // Where on the site: the nearest labelled place, else the page.
      const from = a.closest('[data-track-from]')?.getAttribute('data-track-from') || (window.innerWidth < 820 ? 'phone' : 'desktop');
      track(hit[1], { from });
    },
    true
  );
}
