import { useEffect, useRef, useState } from 'react';
import { projects, getProjectCoverUrl } from '../../data/projects.js';
import styles from './AppSheet.module.css';

/* ─── Project card grid shown inside Portfolio ─── */
function ProjectList({ onProjectTap }) {
  return (
    <div className={styles.projectGrid}>
      {projects.map((project) => {
        const cover = getProjectCoverUrl(project);
        return (
          <button
            key={project.id}
            type="button"
            className={styles.projectCard}
            onClick={() => onProjectTap(project)}
          >
            <div
              className={styles.projectCover}
              style={{ backgroundImage: `url("${cover}")` }}
            />
            <span className={styles.projectName}>{project.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Individual project viewer ─── */
function ProjectDetail({ project, onBack }) {
  const cover = getProjectCoverUrl(project);
  return (
    <div className={styles.projectDetail}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
          <path d="M7 1L1 6.5 7 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Portfolio</span>
      </button>
      <div
        className={styles.projectHero}
        style={{ backgroundImage: `url("${cover}")` }}
      />
      <div className={styles.projectInfo}>
        <h2 className={styles.projectTitle}>{project.name}</h2>
        {project.category && (
          <p className={styles.projectCategory}>{project.category}</p>
        )}
        {project.client && (
          <p className={styles.projectMeta}>Client: {project.client}</p>
        )}
        {project.year && (
          <p className={styles.projectMeta}>Year: {project.year}</p>
        )}
        {project.description && project.description !== '[ placeholder ]' && (
          <p className={styles.projectDesc}>{project.description}</p>
        )}
        <div className={styles.projectTags}>
          {(project.tags || []).map((tag) => (
            <span key={tag} className={styles.projectTag}>{tag}</span>
          ))}
        </div>
        <p className={styles.desktopNote}>
          View full project on desktop for the complete experience.
        </p>
      </div>
    </div>
  );
}

/* ─── About content ─── */
function AboutContent() {
  return (
    <div className={styles.scrollContent}>
      <div className={styles.aboutHero}>
        <div className={styles.aboutAvatar}>
          <svg width="50" height="54" viewBox="0 0 50 54" fill="none">
            <circle cx="25" cy="16" r="14" fill="rgba(255,255,255,0.15)"/>
            <path d="M2 50c0-12.7 10.3-23 23-23s23 10.3 23 23" fill="rgba(255,255,255,0.1)"/>
          </svg>
        </div>
        <h2 className={styles.aboutName}>Kenneth Anandan</h2>
        <p className={styles.aboutTitle}>Creative Designer</p>
      </div>
      <div className={styles.aboutBio}>
        <p>A multidisciplinary creative designer specializing in brand identity, motion design, UI/UX, and print. Passionate about crafting meaningful visual experiences that bridge strategy and aesthetics.</p>
        <p style={{ marginTop: 12 }}>Currently working at Milestone Technologies, bringing creative vision to complex enterprise projects.</p>
      </div>
      <div className={styles.aboutSkills}>
        {['Brand Identity', 'Motion Design', 'UI/UX', 'Print Design', 'Social Media', 'Illustration'].map(s => (
          <span key={s} className={styles.skillChip}>{s}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Resume content ─── */
function ResumeContent() {
  return (
    <div className={styles.scrollContent}>
      <div className={styles.resumeHeader}>
        <p className={styles.resumeIntro}>Kenneth Anandan — Creative Designer</p>
      </div>
      <a
        href="/assets/resume.pdf"
        download
        className={styles.downloadBtn}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v9M4 7l4 4 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 13h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        Download Resume PDF
      </a>
      <div className={styles.resumeSection}>
        <h3 className={styles.sectionHead}>Experience</h3>
        <div className={styles.resumeItem}>
          <p className={styles.resumeRole}>Creative Designer</p>
          <p className={styles.resumeOrg}>Milestone Technologies · 2022–Present</p>
        </div>
      </div>
      <div className={styles.resumeSection}>
        <h3 className={styles.sectionHead}>Skills</h3>
        <p className={styles.resumeSkills}>Adobe CC · Figma · After Effects · Premiere Pro · Illustrator · Photoshop · InDesign</p>
      </div>
    </div>
  );
}

/* ─── Contact content ─── */
function ContactContent() {
  return (
    <div className={styles.scrollContent}>
      <p className={styles.contactIntro}>Let's work together</p>
      <div className={styles.contactLinks}>
        <a href="mailto:kenneth@example.com" className={styles.contactLink}>
          <div className={styles.contactIcon} style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
            <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
              <path d="M0 0h20L10 8z" fill="white" fillOpacity="0.9"/>
              <path d="M0 2v13h20V2L10 10z" fill="white" fillOpacity="0.85"/>
            </svg>
          </div>
          <div>
            <p className={styles.contactLinkLabel}>Email</p>
            <p className={styles.contactLinkSub}>Send a message</p>
          </div>
          <svg className={styles.chevron} width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M1 1l5 4.5L1 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/in/kenneth-anandan/" target="_blank" rel="noreferrer" className={styles.contactLink}>
          <div className={styles.contactIcon} style={{ background: 'linear-gradient(135deg,#0a66c2,#004182)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
              <rect width="4" height="12" x="0" y="6" rx="1"/>
              <circle cx="2" cy="2" r="2"/>
              <path d="M6 18V9a4 4 0 018 0v9h-4v-8a1 1 0 00-2 0v8z"/>
            </svg>
          </div>
          <div>
            <p className={styles.contactLinkLabel}>LinkedIn</p>
            <p className={styles.contactLinkSub}>Connect professionally</p>
          </div>
          <svg className={styles.chevron} width="7" height="11" viewBox="0 0 7 11" fill="none">
            <path d="M1 1l5 4.5L1 10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ─── Game content (desktop only) ─── */
function GameContent({ appKey }) {
  const names = { minesweeper: 'Minesweeper', flappy: 'Flappy Bird', chrome: 'Chrome Dino' };
  return (
    <div className={styles.scrollContent}>
      <div className={styles.gameNotice}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" fill="rgba(255,255,255,0.08)"/>
          <path d="M16 8h16l8 8v24l-8 8H16l-8-8V16z" fill="rgba(255,255,255,0.12)"/>
          <line x1="18" y1="24" x2="18" y2="32" stroke="rgba(255,210,0,0.9)" strokeWidth="3" strokeLinecap="round"/>
          <line x1="14" y1="28" x2="22" y2="28" stroke="rgba(255,210,0,0.9)" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32" cy="22" r="2.5" fill="rgba(255,80,80,0.9)"/>
          <circle cx="38" cy="28" r="2.5" fill="rgba(80,200,80,0.9)"/>
        </svg>
        <h3>{names[appKey] || 'Game'}</h3>
        <p>This game is optimised for the desktop experience.</p>
        <p style={{ marginTop: 8, opacity: 0.5, fontSize: 13 }}>Visit on a larger screen to play.</p>
      </div>
    </div>
  );
}

/* ─── Milestone app content ─── */
function MilestoneContent() {
  return (
    <div className={styles.scrollContent}>
      <div className={styles.milestoneHero}>
        <img src="/assets/icons/desktop-milestone.png" alt="Milestone" className={styles.milestoneIcon}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        <h2>Milestone Technologies</h2>
        <p>Enterprise IT Solutions & Managed Services</p>
      </div>
      <div className={styles.aboutBio}>
        <p>Milestone Technologies is a global IT service management company, providing best-in-class services including managed IT services, cloud solutions, and AV/digital workplace solutions.</p>
        <a href="https://www.milestonetechinc.com" target="_blank" rel="noreferrer" className={styles.downloadBtn} style={{ marginTop: 20, display: 'inline-flex' }}>
          Visit Website
        </a>
      </div>
    </div>
  );
}

/* ─── Social / Print content ─── */
function CategoryContent({ appKey }) {
  const projectMap = {
    social: projects.find(p => p.folder === '05-social-media'),
    print: projects.find(p => p.folder === '08-print-info'),
  };
  const project = projectMap[appKey];
  const cover = project ? getProjectCoverUrl(project) : null;
  const name = appKey === 'social' ? 'Social Media' : 'Print + Info';
  return (
    <div className={styles.scrollContent}>
      {cover && (
        <div className={styles.projectHero} style={{ backgroundImage: `url("${cover}")` }} />
      )}
      <div className={styles.projectInfo}>
        <h2 className={styles.projectTitle}>{name}</h2>
        <p className={styles.desktopNote}>View the full project on desktop for the complete design showcase.</p>
      </div>
    </div>
  );
}

/* ─── App Sheet root ─── */
export default function AppSheet({ app, onClose }) {
  const [visible, setVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const sheetRef = useRef(null);
  const touchRef = useRef({ y: 0, dragging: false });

  useEffect(() => {
    if (app) {
      setSelectedProject(null);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [app]);

  if (!app) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 360);
  };

  /* Swipe down to dismiss */
  const onTouchStart = (e) => {
    touchRef.current = { y: e.touches[0].clientY, dragging: true };
  };
  const onTouchMove = (e) => {
    if (!touchRef.current.dragging) return;
    const delta = e.touches[0].clientY - touchRef.current.y;
    if (delta > 80) {
      touchRef.current.dragging = false;
      handleClose();
    }
  };
  const onTouchEnd = () => { touchRef.current.dragging = false; };

  const appKey = app.appKey;
  const title = app.label;

  let content = null;
  if (selectedProject) {
    content = (
      <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />
    );
  } else if (appKey === 'about') {
    content = <AboutContent />;
  } else if (appKey === 'resume') {
    content = <ResumeContent />;
  } else if (appKey === 'contact') {
    content = <ContactContent />;
  } else if (appKey === 'milestone') {
    content = <MilestoneContent />;
  } else if (appKey === 'social' || appKey === 'print') {
    content = <CategoryContent appKey={appKey} />;
  } else if (['minesweeper', 'flappy', 'chrome'].includes(appKey)) {
    content = <GameContent appKey={appKey} />;
  } else if (appKey && appKey.startsWith('project-')) {
    const projectSlug = appKey.replace('project-', '');
    const project = projects.find(p => p.slug === projectSlug);
    if (project) {
      content = <ProjectDetail project={project} onBack={handleClose} />;
    } else {
      content = <ProjectList onProjectTap={setSelectedProject} />;
    }
  } else {
    content = <ProjectList onProjectTap={setSelectedProject} />;
  }

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
        {/* Drag handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {selectedProject ? selectedProject.name : title}
          </span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line x1="1" y1="1" x2="10" y2="10" stroke="rgba(235,235,245,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="10" y1="1" x2="1" y2="10" stroke="rgba(235,235,245,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.contentArea}>
          {content}
        </div>
      </div>
    </div>
  );
}
