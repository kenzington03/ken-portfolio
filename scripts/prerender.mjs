// After `vite build`: real HTML for every page, for anything that reads the
// site without running it (search engines' first pass, link previews, LLM
// crawlers, screen readers before the app loads).
//
// dist/index.html gets Ken in text (who, what, the work, the career, how to
// reach him) inside #root, which the app replaces when it starts.
// dist/work/<slug>.html is the same page with that project's title,
// description, image and case study, so /work/<slug> is a real address.
// dist/sitemap.xml lists them all.
//
// The text sits off screen until the app replaces it, so nobody sees it flash;
// without JavaScript a <noscript> style puts it on screen.
//
// Data comes straight from src/data (through Vite, so the app's own modules
// load as they are).

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://kennethnathanael.com';
const TODAY = new Date().toISOString().slice(0, 10);

const vite = await createServer({ root: ROOT, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const load = (p) => vite.ssrLoadModule(p);
const [{ projects }, { getCaseStudy }, { SERVICES }, { ROLES }, { LINKEDIN, INSTAGRAM }, { EMAIL, WHATSAPP, BOOKING_URL }] = await Promise.all([
  load('/src/data/projects.js'),
  load('/src/data/caseStudies.js'),
  load('/src/data/services.js'),
  load('/src/data/about.js'),
  load('/src/data/links.js'),
  load('/src/components/Brief/briefData.js'),
]);
await vite.close();

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// (Some paths in the data are already URL-encoded: encode exactly once.)
const enc = (path) => encodeURI(decodeURI(path));
const abs = (path) => (path?.startsWith('http') ? path : `${SITE}${enc(path || '/assets/ui/og-card.png')}`);
const real = (d) => d && d !== '[ placeholder ]';

const STYLE = `<style>
  .pre { position: absolute; left: -10000px; top: 0; width: 1px; height: 1px; overflow: hidden; }
  .pre a { color: inherit; }
</style>
<noscript><style>
  .pre { position: static; width: auto; height: auto; overflow: visible; max-width: 46rem; margin: 0 auto; padding: 48px 20px 64px; font: 17px/1.5 'Instrument Sans', system-ui, sans-serif; color: #121212; }
  body { background: #ededea; }
  .pre h1, .pre h2 { font-family: 'Big Shoulders', system-ui, sans-serif; line-height: 1; }
  .pre h1 { font-size: 56px; margin: 0 0 12px; }
  .pre h2 { font-size: 32px; margin: 40px 0 10px; }
</style></noscript>`;

function contact() {
  return `<h2>Get in touch</h2>
<ul>
  <li><a href="https://wa.me/${WHATSAPP}">WhatsApp</a></li>
  <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
  ${BOOKING_URL ? `<li><a href="${BOOKING_URL}">Book a call</a></li>` : ''}
  <li><a href="/Kenneth-Nathanael-Resume.pdf">Résumé (PDF)</a></li>
  <li><a href="${LINKEDIN}">LinkedIn</a></li>
  <li><a href="${INSTAGRAM}">Instagram</a></li>
</ul>`;
}

const workList = () =>
  `<h2>The work</h2>
<ul>
${projects.map((p) => `  <li><a href="/work/${p.slug}">${esc(p.name)}</a>: ${esc(p.category)}</li>`).join('\n')}
</ul>`;

function home() {
  return `<main class="pre">
<h1>Hi, I'm Kenneth Nathanael. Designer. Building brands for 10+ years.</h1>
<p>Designer in Hyderabad, India (open to remote and relocation). Brands, campaigns, video and web, 10+ years. Design Lead at Milestone Technologies. Open to roles and freelance.</p>
<p>The full portfolio is built as a Mac desktop you can use: open it on a laptop.</p>
<h2>What I do</h2>
<ul>
${SERVICES.map((s) => `  <li><strong>${esc(s.name)}</strong>: ${s.items.map((i) => esc(i.label)).join(', ')}</li>`).join('\n')}
</ul>
${workList()}
<h2>Career</h2>
<ul>
${ROLES.map((r) => `  <li>${esc(r.role)}, ${esc(r.full || r.company)}${r.now ? ` (now ${esc(r.now)})` : ''}, ${esc(r.dates)}</li>`).join('\n')}
</ul>
${contact()}
</main>`;
}

function work(p) {
  const cs = getCaseStudy(p.folder) || {};
  const list = (title, xs) => (xs?.length ? `<h2>${title}</h2>\n<ul>\n${xs.map((x) => `  <li>${esc(x)}</li>`).join('\n')}\n</ul>` : '');
  return `<main class="pre">
<p><a href="/">Kenneth Nathanael, Designer</a></p>
<h1>${esc(p.name)}</h1>
<p>${esc(p.category)}${p.client ? `. ${esc(p.client)}` : ''}${p.year ? `, ${esc(p.year)}` : ''}.</p>
${real(p.description) ? `<p>${esc(p.description)}</p>` : ''}
${cs.brief ? `<h2>The brief</h2>\n<p>${esc(cs.brief)}</p>` : ''}
${cs.role ? `<h2>My role</h2>\n<p>${esc(cs.role)}</p>` : ''}
${list('What I led', cs.lead)}
${list('What I did', cs.did)}
${list('Clients', cs.clients)}
${cs.results?.length ? `<h2>What came of it</h2>\n<ul>\n${cs.results.map((r) => `  <li>${esc(r.value)}: ${esc(r.label)}</li>`).join('\n')}\n</ul>` : ''}
${cs.quote ? `<blockquote><p>“${esc(cs.quote.text)}”</p><footer>${esc(cs.quote.name)}, ${esc(cs.quote.role)}</footer></blockquote>` : ''}
${p.cover ? `<img src="${esc(enc(p.cover))}" alt="${esc(`${p.name}: cover`)}" width="1200" />` : ''}
${workList()}
${contact()}
</main>`;
}

function describe(p) {
  const cs = getCaseStudy(p.folder);
  const d = real(p.description) ? p.description : cs?.brief || `${p.name}, ${p.category}. Design by Kenneth Nathanael.`;
  return d.length > 158 ? `${d.slice(0, 155).replace(/\s+\S*$/, '')}...` : d;
}

/** The built page with this route's head and text. */
function page(base, { path, title, description, image, body }) {
  const url = `${SITE}${path}`;
  let html = base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace('</head>', `${STYLE}\n  </head>`);
  if (image) {
    html = html
      .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${abs(image)}" />`)
      .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${abs(image)}" />`)
      .replace(/\s*<meta property="og:image:(width|height|alt)" content="[^"]*" \/>/g, '');
  }
  return html;
}

const base = await readFile(join(DIST, 'index.html'), 'utf8');
if (!base.includes('<div id="root"></div>')) throw new Error('prerender: dist/index.html has no empty #root (already prerendered?)');

await writeFile(
  join(DIST, 'index.html'),
  page(base, {
    path: '/',
    title: 'Kenneth Nathanael, Designer',
    description: 'Kenneth Nathanael, designer in India. Brands, campaigns, video and web, 10+ years. Open to roles and freelance.',
    body: home(),
  })
);

// dist/work/<slug>.html: with cleanUrls (vercel.json) it is served at /work/<slug>.
await mkdir(join(DIST, 'work'), { recursive: true });
for (const p of projects) {
  await writeFile(
    join(DIST, 'work', `${p.slug}.html`),
    page(base, { path: `/work/${p.slug}`, title: `${p.name}, Kenneth Nathanael`, description: describe(p), image: p.cover, body: work(p) })
  );
}

const urls = [{ loc: `${SITE}/`, lastmod: TODAY }, ...projects.map((p) => ({ loc: `${SITE}/work/${p.slug}`, lastmod: p.dateModified || TODAY }))];
await writeFile(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`
);

console.log(`prerender: / and ${projects.length} projects, sitemap with ${urls.length} URLs`);
