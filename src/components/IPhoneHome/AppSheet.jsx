import { useEffect, useRef, useState } from 'react';
import { projects, getProjectCoverUrl } from '../../data/projects.js';
import { getTagLabel } from '../../data/tags.js';
import styles from './AppSheet.module.css';

/* ─── Content panels ───────────────────────────────────────── */

function PortfolioContent() {
  return (
    <div className={styles.portfolioGrid}>
      {projects.map((project) => (
        <div key={project.id} className={styles.projectCard}>
          <div
            className={styles.projectThumb}
            style={{ backgroundImage: `url("${getProjectCoverUrl(project)}")` }}
          />
          <div className={styles.projectInfo}>
            <span className={styles.projectName}>{project.name}</span>
            <div className={styles.projectTags}>
              {(project.tags ?? []).slice(0, 3).map((t) => (
                <span key={t} className={styles.projectTag}>{getTagLabel(t)}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AboutContent() {
  const skills = ['Brand Identity', 'Motion Graphics', 'UI/UX', 'Video Production', 'Campaigns', 'Print'];
  return (
    <div className={styles.aboutWrap}>
      <div className={styles.aboutAvatar}>KN</div>
      <h2 className={styles.aboutName}>Kenneth Nathanael</h2>
      <p className={styles.aboutTitle}>Design Lead · Milestone Technologies</p>
      <p className={styles.aboutBio}>
        10 years designing brands, campaigns, interfaces, and motion. Based in Hyderabad, India.
        Specialising in brand systems, motion design, and cross-platform campaigns.
      </p>
      <div className={styles.skillsWrap}>
        {skills.map((s) => (
          <span key={s} className={styles.skillTag}>{s}</span>
        ))}
      </div>
      <div className={styles.aboutLinks}>
        <a href="https://linkedin.com/in/kenneth-n-576134103" target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>
          LinkedIn →
        </a>
        <a href="https://behance.net/nathanaelkenneth" target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>
          Behance →
        </a>
      </div>
    </div>
  );
}

function ResumeContent() {
  return (
    <div className={styles.resumeWrap}>
      <div className={styles.resumeIcon}>📄</div>
      <p className={styles.resumeText}>Kenneth Nathanael — Design Lead CV</p>
      <a
        href="/assets/cv.pdf"
        download
        className={styles.resumeBtn}
      >
        Download CV
      </a>
      <p className={styles.resumeHint}>
        Open on desktop for the full experience
      </p>
      <div className={styles.experienceList}>
        {[
          { role: 'Design Lead', company: 'Milestone Technologies', period: 'Dec 2023 – Present' },
          { role: 'Lead Graphic & UI Designer', company: 'Tandem Digital', period: '2021 – 2023' },
          { role: 'Graphic Designer', company: 'WebAnatomy', period: '2019 – 2021' },
          { role: 'Visual Designer', company: 'MiGrocer', period: '2018 – 2019' },
          { role: 'Junior Designer', company: 'Cowboy Studios', period: '2016 – 2018' },
        ].map((item) => (
          <div key={item.company} className={styles.expItem}>
            <span className={styles.expRole}>{item.role}</span>
            <span className={styles.expCompany}>{item.company}</span>
            <span className={styles.expPeriod}>{item.period}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactContent() {
  return (
    <div className={styles.contactWrap}>
      <div className={styles.contactIcon}>✉️</div>
      <p className={styles.contactCta}>Open to Design Lead and Creative Director opportunities.</p>
      <div className={styles.contactList}>
        <a href="mailto:kennethnathanael@gmail.com" className={styles.contactRow}>
          <span className={styles.contactLabel}>Email</span>
          <span className={styles.contactValue}>kennethnathanael@gmail.com</span>
        </a>
        <a href="https://linkedin.com/in/kenneth-n-576134103" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
          <span className={styles.contactLabel}>LinkedIn</span>
          <span className={styles.contactValue}>kenneth-n-576134103</span>
        </a>
        <a href="https://behance.net/nathanaelkenneth" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
          <span className={styles.contactLabel}>Behance</span>
          <span className={styles.contactValue}>nathanaelkenneth</span>
        </a>
        <a href="https://instagram.com/nathanaelkenneth" target="_blank" rel="noopener noreferrer" className={styles.contactRow}>
          <span className={styles.contactLabel}>Instagram</span>
          <span className={styles.contactValue}>@nathanaelkenneth</span>
        </a>
        <div className={styles.contactRow}>
          <span className={styles.contactLabel}>Location</span>
          <span className={styles.contactValue}>Hyderabad, India</span>
        </div>
      </div>
    </div>
  );
}

function ProjectFilterContent({ slug }) {
  const filtered = projects.filter(p => (p.tags ?? []).some(t => {
    if (slug === 'milestone') return p.slug === 'milestone';
    if (slug === 'branding') return t === 'branding';
    if (slug === 'motion') return t === 'motion';
    if (slug === 'web-ui') return t === 'ui-ux';
    if (slug === 'social') return t === 'social';
    if (slug === 'print') return t === 'print';
    return false;
  }));
  const items = filtered.length ? filtered : projects;
  return (
    <div className={styles.portfolioGrid}>
      {items.map((project) => (
        <div key={project.id} className={styles.projectCard}>
          <div
            className={styles.projectThumb}
            style={{ backgroundImage: `url("${getProjectCoverUrl(project)}")` }}
          />
          <div className={styles.projectInfo}>
            <span className={styles.projectName}>{project.name}</span>
            <div className={styles.projectTags}>
              {(project.tags ?? []).slice(0, 3).map((t) => (
                <span key={t} className={styles.projectTag}>{getTagLabel(t)}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GamesContent() {
  return (
    <div className={styles.gamesWrap}>
      <p className={styles.gamesHint}>Games are available in the desktop experience.</p>
      <p className={styles.gamesHint}>Visit <strong>ken-portfolio-nu.vercel.app</strong> on a desktop browser to play Minesweeper, Flappy Bird, and Chrome Dino.</p>
    </div>
  );
}

function getSheetContent(appKey) {
  switch (appKey) {
    case 'portfolio': return <PortfolioContent />;
    case 'about': return <AboutContent />;
    case 'resume': return <ResumeContent />;
    case 'contact': return <ContactContent />;
    case 'games':
    case 'minesweeper': return <GamesContent />;
    default: return <ProjectFilterContent slug={appKey} />;
  }
}

/* ─── Main component ────────────────────────────────────────── */

export default function AppSheet({ app, onClose }) {
  const [visible, setVisible] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (app) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [app]);

  if (!app) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 360);
  };

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    touchCurrentY.current = e.touches[0].clientY;
    const delta = touchCurrentY.current - touchStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${Math.min(delta * 0.5, 120)}px)`;
    }
  };

  const onTouchEnd = () => {
    const delta = touchCurrentY.current - touchStartY.current;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (delta > 80) handleClose();
  };

  return (
    <div
      className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${visible ? styles.sheetVisible : ''}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.header}>
          <span className={styles.headerTitle}>{app.label || app.id}</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.content}>
          {getSheetContent(app.appKey)}
        </div>
      </div>
    </div>
  );
}
