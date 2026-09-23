import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { projects, getProjectCoverUrl } from '../../data/projects.js';
import { CLAUDE_GREETING, getClaudeResponse } from '../../utils/claudeBot.js';
import ChromeDino from '../apps/ChromeDino/ChromeDino.jsx';
import FlappyBird from '../apps/FlappyBird/FlappyBird.jsx';
import Minesweeper from '../apps/Minesweeper/Minesweeper.jsx';
import styles from './AppSheet.module.css';

/* Native canvas sizes (see each game's own W/H, or grid COLS*CELL) —
   scaled down to fit the phone width instead of overflowing it.
   Minesweeper isn't a fixed canvas, but its widest difficulty (Expert)
   is still bounded, so a generous assumed width keeps it from
   overflowing without shrinking the difficulty-picker screen much. */
const GAME_STAGE_SIZE = {
  chrome: { width: 640, height: 240 },
  flappy: { width: 360, height: 520 },
  minesweeper: { width: 480, height: 560 },
};

/* Scales a fixed-size game canvas/board down to fit the phone's width,
   the same trick used to embed a fixed-size iframe responsively. Tap
   controls (the only input these three games need) still work fine
   through a CSS transform. */
function MobileGameStage({ width, height, children }) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      const available = (outerRef.current?.clientWidth ?? window.innerWidth) - 8;
      setScale(Math.min(1, available / width));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [width]);

  return (
    <div ref={outerRef} className={styles.gameStageOuter}>
      <div
        className={styles.gameStageInner}
        style={{ width, height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

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
const PLAYABLE_GAMES = {
  chrome: ChromeDino,
  flappy: FlappyBird,
  minesweeper: Minesweeper,
};

const GAME_NAMES = {
  minesweeper: 'Minesweeper',
  flappy: 'Flappy Bird',
  chrome: 'Chrome Dino',
  tumbleblocks: 'Tetris',
  mazemuncher: 'Pac-Man',
};

function GameContent({ appKey }) {
  const GameComponent = PLAYABLE_GAMES[appKey];

  if (GameComponent) {
    const size = GAME_STAGE_SIZE[appKey];
    return (
      <div className={styles.scrollContent}>
        <MobileGameStage width={size.width} height={size.height}>
          <GameComponent />
        </MobileGameStage>
      </div>
    );
  }

  // Tetris and Pac-Man need arrow-key movement, not just a tap — no
  // on-screen d-pad exists yet, so playing them here would be a canvas
  // you can start but can't actually control. Honest placeholder until
  // that's built, rather than shipping something broken.
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
        <h3>{GAME_NAMES[appKey] || 'Game'}</h3>
        <p>Needs arrow-key controls this phone doesn't have a d-pad for yet.</p>
        <p style={{ marginTop: 8, opacity: 0.5, fontSize: 13 }}>Visit on a larger screen to play.</p>
      </div>
    </div>
  );
}

/* ─── Spotify content — a decorative "Now Playing" card, not a real
   stream. Made-up playlist/track name rather than borrowing a real
   artist's name for placeholder audio, since that would misattribute
   a real song to something it isn't. */
function SpotifyContent() {
  const [playing, setPlaying] = useState(true);

  return (
    <div className={styles.spotifyWrap}>
      <p className={styles.spotifyEyebrow}>PLAYING FROM PLAYLIST</p>
      <p className={styles.spotifyPlaylist}>Late-Night Build Sessions</p>

      <div className={`${styles.spotifyArt} ${playing ? styles.spotifyArtSpin : ''}`}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#1a1a1a" stroke="#3a3a3a" />
          <circle cx="12" cy="12" r="3" fill="#1ED760" />
        </svg>
      </div>

      <p className={styles.spotifyTrack}>Shipping This Portfolio</p>
      <p className={styles.spotifyArtist}>Ken Nathanael</p>

      <div className={styles.spotifyProgress}>
        <div className={styles.spotifyProgressFill} />
      </div>
      <div className={styles.spotifyTimes}>
        <span>1:47</span>
        <span>3:12</span>
      </div>

      <div className={styles.spotifyControls}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 6h2v12H6zM20 6L9 12l11 6z" /></svg>
        <button
          type="button"
          className={styles.spotifyPlayBtn}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#06170D"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#06170D"><path d="M7 5l14 7-14 7z" /></svg>
          )}
        </button>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16 6h2v12h-2zM4 6l11 6-11 6z" /></svg>
      </div>

      <p className={styles.spotifyFootnote}>
        Not wired up to real Spotify — just Ken's dock icon having a personality.
      </p>
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
          <div className={styles.imessageAvatar}>KA</div>
          <p className={styles.imessageContactName}>Ken Anandan</p>
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
function ClaudeMobileContent() {
  const [messages, setMessages] = useState([{ role: 'claude', text: CLAUDE_GREETING }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getClaudeResponse(trimmed);
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
  } else if (appKey === 'imessage') {
    content = <IMessageContent />;
  } else if (appKey === 'spotify') {
    content = <SpotifyContent />;
  } else if (appKey === 'claude') {
    content = <ClaudeMobileContent />;
  } else if (appKey === 'milestone') {
    content = <MilestoneContent />;
  } else if (appKey === 'social' || appKey === 'print') {
    content = <CategoryContent appKey={appKey} />;
  } else if (['minesweeper', 'flappy', 'chrome', 'tumbleblocks', 'mazemuncher'].includes(appKey)) {
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
