// Phones, after the story: the laptop's journey (hero, About, the career,
// the logo, the MacBook opening) plays first (JourneyC), then "hello", then
// this: the work, as the Mac's Portfolio would show it. Best Work first,
// then every project, then the brief and the links. A "Contact me" button
// stays bottom right the whole way.
// Each project opens as a real page at /work/<slug>, so the back gesture,
// the back button and a shared link just work.

import { useCallback, useEffect, useState } from 'react';
import { BEST_WORK_ID, getProjectById, getProjectBySlug, projects } from '../../data/projects.js';
import { BEST_WORK } from '../../data/bestWork.js';
import { getCaseStudy } from '../../data/caseStudies.js';
import { INSTAGRAM, LINKEDIN } from '../../data/links.js';
import { BOOKING_URL, EMAIL, WHATSAPP } from '../Brief/briefData.js';
import { Brief } from '../Brief/BriefSheet.jsx';
import { paletteStyle, readPalette } from '../Journey/C/palette.js';
import MobileProjectGallery from '../IPhoneHome/MobileProjectGallery.jsx';
import { track } from '../../utils/track.js';
import { clearWork, pushWork, titleFor, workSlugFromUrl } from '../../utils/route.js';
import styles from './PhonePage.module.css';

// Every project, Best Work aside (it leads, on its own).
const WORK = projects.filter((p) => p.id !== BEST_WORK_ID).map((p) => p.slug);
const HELLO = encodeURIComponent("Hey Ken, I saw your portfolio. Let's talk.");
const SITE = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';


/** Contact, always a thumb away: bottom right, once the hero's own buttons
 *  have scrolled away, all the way down the page. */
function ContactFab() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // Out of the way once the brief itself is on screen: it is the contact.
    const check = () => {
      const brief = document.getElementById('work-with-me');
      const reached = brief && brief.getBoundingClientRect().top < window.innerHeight * 0.85;
      setOn(window.scrollY > window.innerHeight * 0.8 && !reached);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);
  return (
    <a
      className={`${styles.fab} ${on ? styles.fabOn : ''}`}
      aria-hidden={!on || undefined}
      tabIndex={on ? 0 : -1}
      href="#work-with-me"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById('work-with-me')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
    >
      <span className={styles.fabDot} aria-hidden />
      Contact me
    </a>
  );
}

/** Where the Mac's dive lands: the Portfolio, as a page. */
function Top({ onReplay }) {
  return (
    <header className={styles.top}>
      <button type="button" className={styles.topName} onClick={onReplay} aria-label="Back to the start">
        Ken
      </button>
      <nav className={styles.topLinks} aria-label="Contact">
        <a className={styles.topLink} href="/Kenneth-Nathanael-Resume.pdf" target="_blank" rel="noreferrer">
          Résumé
        </a>
        <a
          className={styles.topHire}
          href="#work-with-me"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('work-with-me')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <i aria-hidden />
          Work with me
        </a>
      </nav>
    </header>
  );
}

/** Best Work: the five the Mac's Portfolio opens on, each with its line. */
function BestWork({ open }) {
  return (
    <section className={styles.section} aria-labelledby="best-h">
      <p className={styles.kicker}>Portfolio</p>
      <h1 id="best-h" className={styles.title}>
        Best work first.
      </h1>
      <ol className={styles.best}>
        {BEST_WORK.map((b, i) => {
          const p = getProjectById(b.projectId);
          return (
            <li key={b.title} className={styles.bestItem}>
              <a className={styles.bestLink} href={p ? `/work/${p.slug}` : undefined} onClick={(e) => p && open(e, p.slug)}>
                <span className={styles.bestShot}>
                  <img src={`/assets/phone/best/${i + 1}.webp`} alt={b.pieces[0].alt} loading={i ? 'lazy' : 'eager'} decoding="async" />
                </span>
                <span className={styles.bestMeta}>
                  <span className={styles.bestNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    {b.client} · {b.kind}
                  </span>
                </span>
                <b className={styles.bestTitle}>{b.title}</b>
                <span className={styles.bestLine}>{b.line}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Work({ open }) {
  return (
    <section className={styles.section} aria-labelledby="work-h">
      <p className={styles.kicker}>Every project</p>
      <h2 id="work-h" className={styles.h2}>
        The rest of the work.
      </h2>
      <ul className={styles.cards}>
        {WORK.map((slug) => {
          const p = getProjectBySlug(slug);
          if (!p) return null;
          return (
            <li key={slug}>
              <a className={styles.card} href={`/work/${slug}`} onClick={(e) => open(e, slug)}>
                {/* Phone-sized covers (800 x 500 WebP), not the desktop originals. */}
                <img src={`/assets/phone/work/${slug}.webp`} alt="" width="800" height="500" loading="lazy" decoding="async" />
                <span className={styles.cardText}>
                  <b>{p.name}</b>
                  <span>{p.category}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MacTeaser() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    track('send_link', { via: navigator.share ? 'share' : 'copy' });
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ken's portfolio", text: 'Open this on a laptop: the whole desktop lives there.', url: SITE });
        return;
      }
      await navigator.clipboard.writeText(SITE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* dismissed */
    }
  };
  return (
    <section className={`${styles.section} ${styles.mac}`} aria-labelledby="mac-h">
      <img className={styles.macShot} src="/assets/phone/mac-poster.webp" alt="Ken's portfolio as a Mac desktop, with the Portfolio window open" loading="lazy" />
      <h2 id="mac-h" className={styles.h2}>
        The rest of the Mac is on a laptop.
      </h2>
      <p className={styles.sub}>The desktop, the files, the games and the cat. Send yourself the link for later.</p>
      <button type="button" className={styles.ctaMain} onClick={share}>
        {copied ? 'Link copied' : 'Send me this link'}
      </button>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footBig}>Say hi.</p>
      <p className={styles.footLinks}>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <a href={`https://wa.me/${WHATSAPP}?text=${HELLO}`} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        <a href={INSTAGRAM} target="_blank" rel="noreferrer">
          Instagram
        </a>
        <a href={LINKEDIN} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </p>
      <p className={styles.footSmall}>Designed and built by Ken, in India.</p>
    </footer>
  );
}

/** The desktop's case study (brief, role, what he did, what came of it), on the page. */
function CaseStory({ project }) {
  const cs = getCaseStudy(project.folder);
  if (!cs) return null;
  return (
    <section className={styles.story} aria-label={`${project.name}, the story`}>
      <p className={styles.storyBrief}>{cs.brief}</p>
      <p className={styles.storyRole}>{cs.role}</p>
      <ul className={styles.storyDid}>
        {[...(cs.lead ?? []), ...cs.did].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {cs.clients && <p className={styles.storyClients}>For {cs.clients.join(', ')}.</p>}
      {cs.results && (
        <dl className={styles.storyResults}>
          {cs.results.map((r) => (
            <div key={r.label}>
              <dt>{r.value}</dt>
              <dd>{r.label}</dd>
            </div>
          ))}
        </dl>
      )}
      {cs.quote && (
        <figure className={styles.storyQuote}>
          <blockquote>“{cs.quote.text}”</blockquote>
          <figcaption>
            {cs.quote.name}, {cs.quote.role}
          </figcaption>
        </figure>
      )}
    </section>
  );
}

function ProjectPage({ slug, back }) {
  const p = getProjectBySlug(slug);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  if (!p) return null;
  return (
    <article className={styles.project}>
      <header className={styles.projectBar}>
        <button type="button" className={styles.back} onClick={back}>
          ← Back
        </button>
      </header>
      <p className={styles.kicker}>{p.category}</p>
      <h1 className={styles.h2}>{p.name}</h1>
      {p.description && p.description !== '[ placeholder ]' && <p className={styles.sub}>{p.description}</p>}
      <CaseStory project={p} />
      <div className={styles.gallery}>
        <MobileProjectGallery project={p} />
      </div>
      <a className={styles.ctaMain} href={BOOKING_URL} target="_blank" rel="noreferrer">
        Want something like this? Book a call
      </a>
    </article>
  );
}

export default function PhonePage({ onReplay }) {
  const [palette] = useState(readPalette);
  const [slug, setSlug] = useState(workSlugFromUrl);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const on = () => setSlug(workSlugFromUrl());
    window.addEventListener('popstate', on);
    window.addEventListener('hashchange', on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener('hashchange', on);
    };
  }, []);
  useEffect(() => {
    titleFor(slug ? getProjectBySlug(slug)?.name : null);
  }, [slug]);
  // Back on the list, return to where they were.
  useEffect(() => {
    if (slug || !scrollY) return undefined;
    const id = requestAnimationFrame(() => window.scrollTo(0, scrollY));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  // The OS keeps the document fixed; this page scrolls like a page.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('intro-scroll');
    return () => root.classList.remove('intro-scroll');
  }, []);
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = prev;
    };
  }, []);

  const open = useCallback((e, s) => {
    e.preventDefault();
    track('project_open', { slug: s, from: 'phone' });
    setScrollY(window.scrollY);
    pushWork(s, getProjectBySlug(s)?.name);
    setSlug(s);
  }, []);
  const back = useCallback(() => {
    if (window.history.state?.work) window.history.back();
    else {
      // Arrived straight on a project (a shared link): back is the page.
      clearWork();
      setSlug(null);
    }
  }, []);

  return (
    <main className={styles.page} style={paletteStyle(palette)}>
      {slug ? (
        <ProjectPage slug={slug} back={back} />
      ) : (
        <>
          <Top onReplay={onReplay} />
          <BestWork open={open} />
          <Work open={open} />
          <section id="work-with-me" className={styles.briefWrap} aria-label="Work with me">
            <Brief headingId="brief-h" />
          </section>
          <MacTeaser />
          <Footer />
          <ContactFab />
        </>
      )}
    </main>
  );
}
