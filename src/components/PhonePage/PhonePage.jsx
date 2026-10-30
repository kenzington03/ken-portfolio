// Phones: one page, no 3D, no fake iOS. Who (Ken, KENNETH), what (one
// line), how to reach him (WhatsApp, email, résumé) in the first screen;
// then proof before the ask: the work, what he does, then the brief, the
// Mac teaser and the links.
// Each project opens as a real page at #/work/<slug>, so the back gesture and
// the back button just work.

import { useCallback, useEffect, useState } from 'react';
import { getProjectBySlug } from '../../data/projects.js';
import { BEHANCE, INSTAGRAM, LINKEDIN } from '../../data/links.js';
import { SERVICES } from '../../data/services.js';
import { EMAIL, WHATSAPP } from '../Brief/briefData.js';
import { Brief } from '../Brief/BriefSheet.jsx';
import { paletteStyle, readPalette } from '../Journey/C/palette.js';
import MobileProjectGallery from '../IPhoneHome/MobileProjectGallery.jsx';
import styles from './PhonePage.module.css';

const WORK = ['fluid-ai', 'marriott', 'lebron-nike', 'branding', 'motion', 'web-ui'];
const HELLO = encodeURIComponent("Hey Ken, I saw your portfolio. Let's talk.");
const SITE = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';

const slugFromHash = () => {
  const m = window.location.hash.match(/^#\/work\/([\w-]+)/);
  return m ? m[1] : null;
};

function Hero() {
  return (
    <header className={styles.hero}>
      <p className={styles.hi}>Hi, I&apos;m</p>
      <h1 className={styles.name}>
        <span className={styles.nameFill} aria-hidden>
          KENNETH
        </span>
        <span className={styles.nameInk}>KENNETH</span>
      </h1>
      <p className={styles.line}>
        <b>Designer.</b> Brands, campaigns, video, web. 10+ years. Open to roles and freelance.
      </p>
      <div className={styles.fig}>
        <span className={styles.floor} aria-hidden />
        <img src="/assets/hero/art/ken.webp" alt="An illustration of Ken holding his laptop" />
        <span className={styles.ball} aria-hidden>
          <img src="/assets/hero/art/ball-skin.webp" alt="" />
        </span>
      </div>
      <nav className={styles.ctas} aria-label="Contact">
        <a className={styles.ctaMain} href={`https://wa.me/${WHATSAPP}?text=${HELLO}`} target="_blank" rel="noreferrer">
          WhatsApp me
        </a>
        <a className={styles.cta} href={`mailto:${EMAIL}`}>
          Email
        </a>
        <a className={styles.cta} href="/cv.pdf" target="_blank" rel="noreferrer">
          Résumé
        </a>
      </nav>
    </header>
  );
}

function Work({ open }) {
  return (
    <section className={styles.section} aria-labelledby="work-h">
      <p className={styles.kicker}>The work</p>
      <h2 id="work-h" className={styles.h2}>
        A few I&apos;m proud of.
      </h2>
      <ul className={styles.cards}>
        {WORK.map((slug) => {
          const p = getProjectBySlug(slug);
          if (!p) return null;
          return (
            <li key={slug}>
              <a className={styles.card} href={`#/work/${slug}`} onClick={(e) => open(e, slug)}>
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

function WhatIDo() {
  return (
    <section className={styles.section} aria-labelledby="do-h">
      <p className={styles.kicker}>What I do</p>
      <h2 id="do-h" className={styles.h2}>
        Three things, done properly.
      </h2>
      <dl className={styles.services}>
        {SERVICES.map((sv) => (
          <div key={sv.id} className={styles.service}>
            <dt>{sv.name}</dt>
            <dd>{sv.items.map((it) => it.label).join(' · ')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MacTeaser() {
  const [copied, setCopied] = useState(false);
  const share = async () => {
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
      <img className={styles.macShot} src="/assets/phone/mac-poster.webp" alt="Ken's portfolio as a Mac desktop, with handwritten notes on the wallpaper" loading="lazy" />
      <h2 id="mac-h" className={styles.h2}>
        The full desktop lives on a laptop.
      </h2>
      <p className={styles.sub}>Every project, every file, built as a Mac you can actually use. Send yourself the link for later.</p>
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
        <a href={BEHANCE} target="_blank" rel="noreferrer">
          Behance
        </a>
      </p>
      <p className={styles.footSmall}>Designed and built by Ken, in India.</p>
    </footer>
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
      <div className={styles.gallery}>
        <MobileProjectGallery project={p} />
      </div>
      <a className={styles.ctaMain} href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hey Ken, I saw ${p.name} on your portfolio. Let's talk.`)}`} target="_blank" rel="noreferrer">
        Want something like this?
      </a>
    </article>
  );
}

export default function PhonePage() {
  const [palette] = useState(readPalette);
  const [slug, setSlug] = useState(slugFromHash);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const on = () => setSlug(slugFromHash());
    window.addEventListener('popstate', on);
    window.addEventListener('hashchange', on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener('hashchange', on);
    };
  }, []);
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
    setScrollY(window.scrollY);
    window.history.pushState({ work: s }, '', `#/work/${s}`);
    setSlug(s);
  }, []);
  const back = useCallback(() => {
    if (window.history.state?.work) window.history.back();
    else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setSlug(null);
    }
  }, []);

  return (
    <main className={styles.page} style={paletteStyle(palette)}>
      {slug ? (
        <ProjectPage slug={slug} back={back} />
      ) : (
        <>
          <Hero />
          <Work open={open} />
          <WhatIDo />
          <section className={styles.briefWrap} aria-label="Work with me">
            <Brief headingId="brief-h" />
          </section>
          <MacTeaser />
          <Footer />
        </>
      )}
    </main>
  );
}
