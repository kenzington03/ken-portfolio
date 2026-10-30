// Phones: one page, no 3D. A note first that the full site is a Mac desktop
// (best on a laptop), with the iPhone beta behind the cat. Then who (Ken,
// KENNETH), what, how to reach him; his ball drops through a net as you
// scroll on; who he is, loud (the same paragraph and collage as the laptop);
// the work, what he does, the brief, the Mac teaser and the links. A
// "Contact me" button stays bottom right the whole way.
// Each project opens as a real page at #/work/<slug>, so the back gesture and
// the back button just work.

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { getProjectBySlug } from '../../data/projects.js';
import { BEHANCE, INSTAGRAM, LINKEDIN } from '../../data/links.js';
import { SERVICES } from '../../data/services.js';
import { EMAIL, WHATSAPP } from '../Brief/briefData.js';
import { Brief } from '../Brief/BriefSheet.jsx';
import { paletteStyle, readPalette } from '../Journey/C/palette.js';
import { COLLAGE, STORY } from '../Journey/C/MePanel.jsx';
import MobileProjectGallery from '../IPhoneHome/MobileProjectGallery.jsx';
import styles from './PhonePage.module.css';

const WORK = ['fluid-ai', 'marriott', 'lebron-nike', 'branding', 'motion', 'web-ui'];
const HELLO = encodeURIComponent("Hey Ken, I saw your portfolio. Let's talk.");
const SITE = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';

const slugFromHash = () => {
  const m = window.location.hash.match(/^#\/work\/([\w-]+)/);
  return m ? m[1] : null;
};

/** The full site lives on a laptop; the iPhone beta is behind the cat. */
function LaptopNote({ onIPhone }) {
  return (
    <aside className={styles.laptop}>
      <p>
        <b>This portfolio is built as a macOS desktop.</b> Best viewed on a laptop.
      </p>
      <button type="button" className={styles.catBtn} onClick={onIPhone}>
        <img src="/assets/icons/desktop-Resume.png" alt="" />
        <span>
          Try the iPhone beta
          <small>Tap the cat</small>
        </span>
      </button>
    </aside>
  );
}

/** His ball drops through a net as the page scrolls past the hero. */
function Swish() {
  const boxRef = useRef(null);
  const ballRef = useRef(null);
  const netRef = useRef(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = 0;
      const box = boxRef.current;
      const ball = ballRef.current;
      const net = netRef.current;
      if (!box || !ball || !net) return;
      const r = box.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the hoop comes up from the bottom of the screen, 1 as it passes the middle.
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      const h = r.height;
      // It falls (gravity: it speeds up), drifting in from the left to the rim.
      const fall = p * p;
      const y = -h * 0.55 + (h * 1.05) * fall;
      const x = (1 - Math.min(1, p * 1.3)) * -70;
      ball.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(p * 540).toFixed(0)}deg)`;
      ball.style.opacity = p > 0.98 ? '0' : '1';
      // The net gives as the ball goes through it.
      const through = Math.max(0, Math.min(1, (y - h * 0.18) / (h * 0.3)));
      const swish = Math.sin(Math.PI * through);
      net.style.transform = `scale(${(1 - swish * 0.12).toFixed(3)}, ${(1 + swish * 0.3).toFixed(3)})`;
      document.documentElement.style.setProperty('--hero-ball', p > 0.02 ? '0' : '1');
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      document.documentElement.style.removeProperty('--hero-ball');
    };
  }, []);
  return (
    <div ref={boxRef} className={styles.swish} aria-hidden>
      <svg className={styles.hoopBack} viewBox="0 0 160 40">
        <path d="M10 18C10 6 150 6 150 18" />
      </svg>
      <span ref={ballRef} className={styles.swishBall}>
        <img src="/assets/hero/art/ball-real.webp" alt="" />
      </span>
      <svg ref={netRef} className={styles.net} viewBox="0 0 160 120">
        <path d="M12 20L36 104M34 24L48 108M58 26L64 110M102 26L96 110M126 24L112 108M148 20L124 104" />
        <path d="M18 44C60 54 100 54 142 44M26 70C62 78 98 78 134 70M34 96C64 102 96 102 126 96" />
      </svg>
      <svg className={styles.rim} viewBox="0 0 160 40">
        <path d="M10 18C10 30 150 30 150 18" />
      </svg>
      <p className={styles.swishWord}>Nothing but net.</p>
    </div>
  );
}

/** Who he is, loud: the laptop's section 2, on a slab of the poster's ink. */
function AboutSlab() {
  return (
    <section className={styles.slab} aria-label="About Ken">
      {STORY.map((line, i) => {
        const Tag = line.kind === 'hello' ? 'h2' : 'p';
        return (
          <Tag key={i} className={styles[`s_${line.kind}`]}>
            {line.parts.map((part, j) => (
              <Fragment key={j}>
                {j > 0 && ' '}
                {typeof part === 'string' ? part : <mark className={styles.hl}>{part.hl}</mark>}
              </Fragment>
            ))}
          </Tag>
        );
      })}
      <div className={styles.collageGrid}>
        {COLLAGE.map((c, i) => (
          <img key={c.id} className={styles.collagePic} src={`/assets/me/collage/${c.id}.webp`} alt={c.alt} loading="lazy" style={{ '--r': `${[-3, 2.5, -2, 3, -1.5, 2][i]}deg` }} />
        ))}
      </div>
    </section>
  );
}

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
          <img src="/assets/hero/art/ball-real.webp" alt="" />
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
      <img className={styles.macShot} src="/assets/phone/mac-poster.webp" alt="Ken's portfolio as a Mac desktop, with the Portfolio window open" loading="lazy" />
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
      {p.description && p.description !== '[ placeholder ]' && <p className={styles.sub}>{p.description}</p>}
      <div className={styles.gallery}>
        <MobileProjectGallery project={p} />
      </div>
      <a className={styles.ctaMain} href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hey Ken, I saw ${p.name} on your portfolio. Let's talk.`)}`} target="_blank" rel="noreferrer">
        Want something like this?
      </a>
    </article>
  );
}

export default function PhonePage({ onIPhone }) {
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
          <LaptopNote onIPhone={onIPhone} />
          <Hero />
          <Swish />
          <AboutSlab />
          <Work open={open} />
          <WhatIDo />
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
