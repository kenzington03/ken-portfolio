import { useEffect, useRef, useState } from 'react';
import { projects, getProjectCoverUrl } from '../../data/projects.js';
import { CLAUDE_GREETING, CLAUDE_TOPICS, getClaudeResponse } from '../../utils/claudeBot.js';
import { ROLES } from '../../data/about.js';
import { motion } from 'framer-motion';
import MobileProjectGallery from './MobileProjectGallery.jsx';
import StatusBar from './StatusBar.jsx';
import MobileGame from './MobileGame.jsx';
import SpotifyApp from './SpotifyApp.jsx';
import styles from './AppSheet.module.css';

/* ─── Project list ─── */
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
/** The navigation bar above it carries the name and the back button. */
function ProjectDetail({ project }) {
  const cover = getProjectCoverUrl(project);
  return (
    <div className={styles.projectDetail}>
      <div
        className={styles.projectHero}
        style={{ backgroundImage: `url("${cover}")` }}
      />
      <div className={styles.projectInfo}>
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
      </div>
      <div className={styles.gallery}>
        <MobileProjectGallery project={project} />
      </div>
    </div>
  );
}

/* ─── About content ─── */
function AboutContent() {
  return (
    <div className={styles.scrollContent}>
      <div className={styles.aboutHero}>
        <img className={styles.aboutAvatar} src="/assets/profile/ken.jpg" alt="Kenneth Nathanael" />
        <h2 className={styles.aboutName}>Kenneth Nathanael</h2>
        <p className={styles.aboutTitle}>Designer · India</p>
      </div>
      <div className={styles.aboutBio}>
        <p>Ten years shaping brands, campaigns and interfaces. I start with the idea and stay for the last pixel.</p>
        <p style={{ marginTop: 12 }}>Based in Hyderabad. Brand identity, motion, video, UI/UX and print, from the first sketch to the file that ships.</p>
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
        <p className={styles.resumeIntro}>Kenneth Nathanael, Designer</p>
      </div>
      <a
        href="/cv.pdf"
        download="Kenneth-Nathanael-Resume.pdf"
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
        {ROLES.map((r) => (
          <div key={`${r.company}-${r.from}`} className={styles.resumeItem}>
            <p className={styles.resumeRole}>{r.role}</p>
            <p className={styles.resumeOrg}>
              {r.company} · {r.dates.replace(' - ', ' to ')}
            </p>
          </div>
        ))}
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
        <a href="mailto:kennethnathanael@gmail.com" className={styles.contactLink}>
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
        <a href="https://linkedin.com/in/kenneth-n-576134103" target="_blank" rel="noreferrer" className={styles.contactLink}>
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

/* ─── iMessage content ─── */
function IMessageContent() {
  const [draft, setDraft] = useState('');

  const onSend = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    window.location.href = `mailto:kennethnathanael@gmail.com?subject=${encodeURIComponent('Hey Ken 👋')}&body=${encodeURIComponent(trimmed)}`;
    setDraft('');
  };

  return (
    <div className={styles.imessageWrap}>
      <div className={styles.imessageThread}>
        <div className={styles.imessageContact}>
          <div className={styles.imessageAvatar}>KN</div>
          <p className={styles.imessageContactName}>Ken Nathanael</p>
        </div>
        <span className={styles.imessageTimestamp}>iMessage</span>
        <div className={styles.imessageRow}>
          <div className={styles.imessageBubbleIn}>Hey! 👋 Thanks for stopping by my portfolio.</div>
        </div>
        <div className={styles.imessageRow}>
          <div className={styles.imessageBubbleIn}>
            Have a project in mind, or just want to say hi? Send me a message and I'll get back to you.
          </div>
        </div>
      </div>
      <form className={styles.imessageInputBar} onSubmit={onSend}>
        <input
          type="text"
          className={styles.imessageInput}
          placeholder="iMessage"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className={styles.imessageSendBtn}
          disabled={!draft.trim()}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill={draft.trim() ? '#0a84ff' : 'rgba(255,255,255,0.15)'} />
            <path d="M9 12.5V5.5M9 5.5L5.5 9M9 5.5L12.5 9" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/* ─── Claude content (mobile) ─── */
const SUGGESTED = CLAUDE_TOPICS.flatMap((t) => t.questions.slice(0, 2));
function ClaudeMobileContent() {
  const [messages, setMessages] = useState([{ role: 'claude', text: CLAUDE_GREETING }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // `answer`: a suggested question already knows its reply.
  const sendMessage = (text, answer) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = answer ?? getClaudeResponse(trimmed);
      setMessages((prev) => [...prev, { role: 'claude', text: reply }]);
      setTyping(false);
    }, 800);
  };

  return (
    <div className={styles.imessageWrap}>
      <div className={styles.imessageThread} ref={scrollRef}>
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={styles.imessageRow}
            style={msg.role === 'user' ? { justifyContent: 'flex-end' } : undefined}
          >
            <div className={msg.role === 'user' ? styles.imessageBubbleOut : styles.imessageBubbleIn}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className={styles.imessageRow}>
            <div className={styles.imessageBubbleIn}>
              <span className={styles.typingDots}>
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Suggested questions, as a scrolling row above the field. */}
      <div className={styles.suggestions}>
        {SUGGESTED.map(({ q, a: answer }) => (
          <button key={q} type="button" className={styles.suggestion} onClick={() => sendMessage(q, answer)} disabled={typing}>
            {q}
          </button>
        ))}
      </div>
      <form
        className={styles.imessageInputBar}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          type="text"
          className={styles.imessageInput}
          placeholder="Ask about Ken..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={typing}
        />
        <button
          type="submit"
          className={styles.imessageSendBtn}
          disabled={!input.trim() || typing}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill={input.trim() ? '#0a84ff' : 'rgba(255,255,255,0.15)'} />
            <path d="M9 12.5V5.5M9 5.5L5.5 9M9 5.5L12.5 9" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
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
  return (
    <div className={styles.scrollContent}>
      {cover && (
        <div className={styles.projectHero} style={{ backgroundImage: `url("${cover}")` }} />
      )}
      {project && (
        <div className={styles.gallery}>
          <MobileProjectGallery project={project} />
        </div>
      )}
    </div>
  );
}

/* ─── The app, full screen ───
   iOS apps never open as sheets: they zoom out of the icon that was tapped
   (the icon's colour fills the frame, then the app shows through), run full
   screen under the status bar, and close with a swipe up from the home
   indicator, shrinking back into the icon. */

// Apps that draw their own full-screen UI (no navigation bar).
const IMMERSIVE = new Set(['minesweeper', 'flappy', 'chrome', 'tumbleblocks', 'mazemuncher', 'spotify']);
// Apps with a light background: black status bar and home indicator.
const LIGHT = new Set(['chrome']);
const SPRING = { type: 'spring', stiffness: 320, damping: 36, mass: 0.9 };

function iconClip(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect) return `inset(${vh * 0.36}px ${vw * 0.32}px ${vh * 0.36}px ${vw * 0.32}px round 28px)`;
  return `inset(${rect.top}px ${vw - rect.right}px ${vh - rect.bottom}px ${rect.left}px round ${rect.width * 0.225}px)`;
}

function HomeIndicator({ tone, onClose }) {
  const start = useRef(null);
  const down = (y) => {
    start.current = y;
  };
  const move = (y) => {
    if (start.current != null && start.current - y > 36) {
      start.current = null;
      onClose();
    }
  };
  return (
    <div
      className={`${styles.homeIndicator} ${tone === 'dark' ? styles.homeIndicatorDark : ''}`}
      onTouchStart={(e) => down(e.touches[0].clientY)}
      onTouchMove={(e) => move(e.touches[0].clientY)}
      onPointerDown={(e) => e.pointerType === 'mouse' && down(e.clientY)}
      onPointerMove={(e) => e.pointerType === 'mouse' && move(e.clientY)}
      onPointerUp={() => (start.current = null)}
      onClick={onClose}
      role="button"
      aria-label="Close app"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
    >
      <span />
    </div>
  );
}

export default function AppSheet({ app, onClose }) {
  const [shown, setShown] = useState(null);
  const [closing, setClosing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (!app) return;
    setShown(app);
    setClosing(false);
    setSelectedProject(null);
  }, [app]);

  useEffect(() => {
    if (!shown) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown]);

  if (!shown) return null;

  const close = () => setClosing(true);
  const appKey = shown.appKey;
  const immersive = IMMERSIVE.has(appKey);
  const tone = LIGHT.has(appKey) ? 'dark' : 'light';
  const clip = iconClip(shown.rect);

  let content = null;
  let title = shown.label;
  if (selectedProject) {
    content = <ProjectDetail project={selectedProject} />;
    title = selectedProject.name;
  } else if (appKey === 'about') {
    content = <AboutContent />;
  } else if (appKey === 'resume') {
    content = <ResumeContent />;
  } else if (appKey === 'contact') {
    content = <ContactContent />;
  } else if (appKey === 'imessage') {
    content = <IMessageContent />;
  } else if (appKey === 'spotify') {
    content = <SpotifyApp />;
  } else if (appKey === 'claude') {
    content = <ClaudeMobileContent />;
  } else if (appKey === 'milestone') {
    content = <MilestoneContent />;
  } else if (appKey === 'social' || appKey === 'print') {
    content = <CategoryContent appKey={appKey} />;
  } else if (IMMERSIVE.has(appKey)) {
    content = <MobileGame appKey={appKey} />;
  } else if (appKey && appKey.startsWith('project-')) {
    const project = projects.find((p) => p.slug === appKey.replace('project-', ''));
    content = project ? <ProjectDetail project={project} /> : <ProjectList onProjectTap={setSelectedProject} />;
  } else {
    content = <ProjectList onProjectTap={setSelectedProject} />;
  }

  return (
    <motion.div
      className={`${styles.app} ${tone === 'dark' ? styles.appLight : ''}`}
      initial={{ clipPath: clip }}
      animate={{ clipPath: closing ? clip : 'inset(0px 0px 0px 0px round 0px)' }}
      transition={SPRING}
      onAnimationComplete={() => {
        if (closing) {
          setShown(null);
          setClosing(false);
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={shown.label}
    >
      <motion.div
        className={styles.appBody}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={closing ? { scale: 0.9, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={closing ? { duration: 0.22 } : { ...SPRING, opacity: { duration: 0.28, delay: 0.1 } }}
      >
        <StatusBar tone={tone} />
        {immersive ? (
          <div className={styles.immersive}>{content}</div>
        ) : (
          <>
            <header className={styles.nav}>
              {selectedProject && (
                <button type="button" className={styles.back} onClick={() => setSelectedProject(null)}>
                  <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
                    <path d="M10 2L2 10l8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {shown.label}
                </button>
              )}
              <h1 className={styles.largeTitle}>{title}</h1>
            </header>
            <div className={styles.contentArea}>{content}</div>
          </>
        )}
      </motion.div>

      {/* The icon itself, filling the frame as it opens and as it closes. */}
      <motion.div
        className={styles.appIcon}
        style={{ background: shown.cover ? `center / cover url("${shown.cover}")` : shown.style || '#1c1c1e' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: closing ? 1 : 0 }}
        transition={closing ? { duration: 0.2, delay: 0.05 } : { duration: 0.3, delay: 0.12 }}
        aria-hidden
      >
        {!shown.cover && (shown.imgSrc ? <img src={shown.imgSrc} alt="" /> : <span className={styles.appIconGlyph}>{shown.icon}</span>)}
      </motion.div>

      <HomeIndicator tone={tone} onClose={close} />
    </motion.div>
  );
}
