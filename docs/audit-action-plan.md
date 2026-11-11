# Audit action plan (from the Nov 10, 2026 review, 57/100)

Source: `~/Downloads/kennethnathanael.com — Website Audit & Creative Director Review.md`.
One phase per session; commit and deploy at the end of each so nothing piles up.
Model column = what to run that session on (`/model`).

## Done, Nov 11
- [x] swish.mp3 in `public/assets/sfx/` (kills the 404 + console error that cost Best Practices)
- [x] Timeline logos: DreamWorks, ABAI, Phygital24 (on the MiGrocer row), Tandem Digital, backgrounds keyed out
- [x] Tides screensaver never ends: pace breathes, tide self-balances
- [x] Desktop icon labels stay white in light mode
- [x] Deleted `public/__tmp`, `_to_delete`, `awesome-ios-ui-master.zip`, `cat-lab.html` (in Trash: `portfolio-cleanup-2026-11-11`)
- [x] LeBron watermark gone: all 5 copies replaced with a frame of Ken's own concept video
- [x] `sitemap.xml` + robots.txt Sitemap line (homepage only until real routes, Phase 3)
- [x] Best Work folder: 12 picks leading the Portfolio, opens with it, real alt text on each
- [x] Hetfield artwork was saved mirrored; flipped (original in Trash)

## Phase 1: measure + quick credibility (Sonnet 5.5, ~1 session)
1. `@vercel/analytics` + `@vercel/speed-insights` (ask before npm install). Enable in Vercel dashboard.
2. One `track(event, props)` helper; wire: whatsapp_tap, email_tap, resume_download, cal_booked
   (Cal.com: https://cal.com/kenneth-nathanael-hymjak), project_open {slug}, mac_opened, send_link, service_pick.
3. CSP: add Vercel analytics endpoints (`/_vercel/insights`, `/_vercel/speed-insights`) to connect-src/script-src.
4. Contrast: footer "Say hi." to tomato/white; mobile case-study section titles to ink.
5. Mobile: move "Best viewed on a laptop" banner to the footer, drop "beta"; space "Hi, I'm" off KENNETH; WhatsApp/Email/Résumé above the fold.
6. Mark decorative duplicate H1 `aria-hidden`; fix empty career H3s (logos as `<img alt>` inside the heading already; check what renders empty).
7. **Ken:** watermarked LeBron image (`hero images/hero-lebron-nike.jpg`, `journey/hero-lebron-nike.jpg`, `about/lebron-nike.jpg`, `me/collage/lebron.webp`, `phone/work/lebron-nike.webp`). Pick a replacement frame or drop the project.
8. **Ken (manual):** verify domain in Google Search Console.

## Phase 2: speed (Sonnet 5.5, 1 session; film the Mac open after)
1. GLB loaded twice: `MODEL_SRC` in `Intro/MacScene.jsx` and `Journey/C/JourneyC.jsx`. One shared constant, one preload, only when the Mac is near (not on first paint).
2. Images: script (sharp or sips) to make WebP + 2 sizes; Resume icon → 140 px WebP; `ken.webp` srcset; wallpaper + ball textures recompressed. Target: under 1.2 MB desktop first load.
3. Fonts: self-host Big Shoulders + Instrument Sans (woff2, `font-display: swap`, preload one); drop Inter from Google Fonts and the unused Cabinet Grotesk/Satoshi/Tanker `@font-face`s.
4. Lazy-load: games, Terminal, Minesweeper etc. via `React.lazy`; split three/R3F out of the main chunk.
5. Sound: load `shutter.wav`/`swish.mp3` on first sound-on, not page start.
6. Re-run PageSpeed (mobile + desktop). Goal: desktop TBT < 300 ms, mobile LCP < 2.5 s.

## Phase 3: SEO (Opus 5.5 to plan routing, Sonnet to build)
1. In `index.html`: canonical, `Person` JSON-LD (name, jobTitle, address Bangalore, sameAs LinkedIn/Instagram), `<noscript>` block with H1, short bio and links.
2. `public/sitemap.xml`, `public/llms.txt`, branded `404.html` (vercel.json rewrite).
3. Real routes `/work/<slug>` instead of `#/work/<slug>`; per-route title/description/og:image.
4. Pre-render: build-time script that writes `dist/index.html` + `dist/work/<slug>/index.html` with real text (vite-plugin-prerender or a small Playwright/`renderToString` step). Desktop: real `<a>` for résumé, LinkedIn, email, projects.

## Phase 4: accessibility (Sonnet 5.5)
1. Alt text for every work image (data files: `caseStudies.js`, `projects.js`). Draft with vision, Ken approves.
2. Tap targets ≥ 44 px on footer/résumé/LinkedIn links.
3. Scroll intro: arrow/PageDown/Space advance it, `prefers-reduced-motion` skips to the Mac, a "Skip to work" link.
4. Desktop icons + windows reachable by Tab/Enter; fix prohibited ARIA flagged by Lighthouse.
5. Double-click on a project opens one window, not two.

## Phase 5: content + design (Opus 5.5; mostly Ken's input)
1. **Ken:** one result + one quote per case study; one line per big name (what you did for DreamWorks DU, Marriott, Milestone).
2. Rename category projects (Branding, Motion, Web + UI) to the client/brief.
3. One services list + one experience line everywhere ("10+ years").
4. Rewrite slogan lines (audit's rewrites table); decide how AI shows up.
5. Port desktop case-study text (brief, role, bullets) into mobile case studies.
6. Real-work covers in the poster language (replace neon/glass covers).
7. Cut contact CTAs to one primary (WhatsApp or Cal.com) + one secondary (résumé).
8. Later: "Ken OS" (own icons/wallpaper/type), restyle enquiry form in poster language, unbranded laptop, CSP enforced.

## Ongoing
After every phase: PageSpeed mobile + desktop, Lighthouse incognito. Monthly: Search Console name search, Clarity heatmaps (optional).
