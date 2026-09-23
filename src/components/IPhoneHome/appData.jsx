import { projects, getProjectCoverUrl } from '../../data/projects.js';
import { PacManGlyph, TetrisGlyph, FlappyBirdGlyph } from '../icons/GameGlyphs.jsx';

/* ─── SVG Icons (filled, iOS-style white on gradient bg) ─── */
const PersonIcon = () => (
  <svg width="28" height="30" viewBox="0 0 28 30" fill="none">
    <circle cx="14" cy="9" r="7.5" fill="white"/>
    <path d="M1 28c0-7.18 5.82-13 13-13s13 5.82 13 13" fill="white"/>
  </svg>
);

const DocIcon = () => (
  <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
    <path d="M2 2h16l6 6v22H2z" fill="white" fillOpacity="0.95"/>
    <path d="M18 2v6h6" fill="rgba(0,0,0,0.12)"/>
    <line x1="6" y1="15" x2="20" y2="15" stroke="rgba(100,180,255,0.8)" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="6" y1="20" x2="20" y2="20" stroke="rgba(100,180,255,0.6)" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="6" y1="25" x2="14" y2="25" stroke="rgba(100,180,255,0.4)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const MailIcon = () => (
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
    <path d="M1 1h30l-13 9a3 3 0 01-4 0z" fill="white" fillOpacity="0.9"/>
    <path d="M1 5v17h30V5L16 14z" fill="white" fillOpacity="0.85"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
    <circle cx="13" cy="5" r="4.5" fill="white"/>
    <circle cx="4" cy="20" r="4.5" fill="white"/>
    <circle cx="22" cy="20" r="4.5" fill="white"/>
    <line x1="9.8" y1="7.8" x2="7.2" y2="17.2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="16.2" y1="7.8" x2="18.8" y2="17.2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PrintIcon = () => (
  <svg width="30" height="28" viewBox="0 0 30 28" fill="none">
    <rect x="5" y="1" width="20" height="10" rx="1.5" fill="white" fillOpacity="0.9"/>
    <rect x="5" y="18" width="20" height="9" rx="1.5" fill="white" fillOpacity="0.9"/>
    <path d="M5 11H3a2.5 2.5 0 00-2.5 2.5v5H5" fill="white" fillOpacity="0.7"/>
    <path d="M25 11h2a2.5 2.5 0 012.5 2.5v5H25" fill="white" fillOpacity="0.7"/>
  </svg>
);

const GamepadIcon = () => (
  <svg width="34" height="24" viewBox="0 0 34 24" fill="none">
    <path d="M8 0h18l6 5v14l-6 5H8L2 19V5z" fill="white" fillOpacity="0.9"/>
    <line x1="10" y1="8" x2="10" y2="16" stroke="rgba(255,210,0,1)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="6" y1="12" x2="14" y2="12" stroke="rgba(255,210,0,1)" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="9" r="2.2" fill="rgba(255,60,60,0.9)"/>
    <circle cx="28" cy="13" r="2.2" fill="rgba(60,200,100,0.9)"/>
  </svg>
);

const IMessageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M16 2C7.72 2 1 7.94 1 15.3c0 4.06 2.06 7.7 5.3 10.13-.18 2-1.02 3.7-1.72 4.8-.16.26.05.6.36.55 2.2-.37 4.5-1.34 6.06-2.32 1.55.45 3.24.7 5 .7 8.28 0 15-5.94 15-13.3S24.28 2 16 2z"
      fill="white"
      fillOpacity="0.96"
    />
  </svg>
);

const ClaudeSparkIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <path
      d="M15 3l3 9.5L27.5 15 18 18l-3 9.5-3-9.5L2.5 15 12 12.5z"
      fill="white"
      fillOpacity="0.95"
    />
  </svg>
);

const MilestoneIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <path d="M5 25L15 5l10 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M8.5 18h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/* ─── Dock glyphs ─── */
const PhoneIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M6.5 3h4.2l2 5.5-2.7 2.3c1.3 3 3.7 5.4 6.7 6.7l2.3-2.7 5.5 2v4.2c0 1.4-1.2 2.5-2.6 2.3C12.3 22.2 5.8 15.7 4.7 6.1 4.5 4.7 5.6 3 6.5 3z"
      fill="white"
    />
  </svg>
);

const SafariIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <circle cx="15" cy="15" r="12.5" fill="white" />
    <circle cx="15" cy="15" r="11" fill="#e8e8ed" />
    <circle cx="15" cy="15" r="9.5" fill="white" />
    {[...Array(12)].map((_, i) => (
      <rect key={i} x="14.6" y="4.2" width="0.8" height="2.2" fill="#8e8e93" transform={`rotate(${i * 30} 15 15)`} />
    ))}
    <path d="M15 8L18 15L15 22L12 15Z" fill="#ff3b30" />
    <path d="M15 15L18 15L15 22Z" fill="#0a84ff" />
  </svg>
);

const SpotifyIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <circle cx="15" cy="15" r="14" fill="#1ED760" />
    <path d="M8.5 11.5c4-1.2 9-1 12.5 1" stroke="#06170D" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M8.8 15.5c3.4-1 7.6-.8 10.6.9" stroke="#06170D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M9.2 19.3c2.8-.8 6.2-.6 8.6.8" stroke="#06170D" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

/* ─── Project icons for Portfolio folder ─── */
export const PROJECT_APPS = projects.map((p) => ({
  id: `project-${p.id}`,
  label: p.name,
  type: 'app',
  appKey: `project-${p.slug}`,
  projectId: p.id,
  cover: getProjectCoverUrl(p),
  style: 'linear-gradient(145deg, #1c1c1e 0%, #2c2c2e 100%)',
}));

/* ─── Home screen apps ─── */
export const HOME_APPS = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    type: 'folder',
    folderColor: 'linear-gradient(145deg, #0a84ff 0%, #0059c9 100%)',
    apps: PROJECT_APPS,
  },
  {
    id: 'about',
    label: 'About Me',
    type: 'app',
    appKey: 'about',
    style: 'linear-gradient(135deg, #1c4ed8 0%, #1e3a8a 100%)',
    icon: <PersonIcon />,
  },
  {
    id: 'contact',
    label: 'Contact',
    type: 'app',
    appKey: 'contact',
    style: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    icon: <MailIcon />,
  },
  {
    id: 'resume',
    label: 'Resume',
    type: 'app',
    appKey: 'resume',
    style: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
    icon: <DocIcon />,
  },
  {
    id: 'imessage',
    label: 'iMessage',
    type: 'app',
    appKey: 'imessage',
    style: 'linear-gradient(135deg, #63e550 0%, #24c227 100%)',
    icon: <IMessageIcon />,
  },
  {
    id: 'claude',
    label: 'Claude',
    type: 'app',
    appKey: 'claude',
    imgSrc: '/assets/icons/dock-claude-logo.png',
    style: 'linear-gradient(135deg, #da7756 0%, #bd5b3a 100%)',
    icon: <ClaudeSparkIcon />,
  },
  {
    id: 'milestone',
    label: 'Milestone',
    type: 'app',
    appKey: 'milestone',
    imgSrc: '/assets/icons/desktop-milestone.png',
    style: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    icon: <MilestoneIcon />,
  },
  {
    id: 'social',
    label: 'Social Media',
    type: 'app',
    appKey: 'social',
    style: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    icon: <ShareIcon />,
  },
  {
    id: 'print',
    label: 'Print + Info',
    type: 'app',
    appKey: 'print',
    style: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    icon: <PrintIcon />,
  },
  {
    id: 'games',
    label: 'Games',
    type: 'folder',
    folderColor: 'linear-gradient(145deg, #d97706 0%, #b45309 100%)',
    apps: [
      {
        id: 'minesweeper',
        label: 'Minesweeper',
        type: 'app',
        appKey: 'minesweeper',
        imgSrc: '/assets/icons/desktop-minesweeper.png',
        style: 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)',
        icon: <GamepadIcon />,
      },
      {
        id: 'flappy',
        label: 'Flappy Bird',
        type: 'app',
        appKey: 'flappy',
        style: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        icon: <FlappyBirdGlyph />,
      },
      {
        id: 'chrome',
        label: 'Chrome Dino',
        type: 'app',
        appKey: 'chrome',
        imgSrc: '/assets/icons/desktop-chrome.png',
        style: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        icon: <GamepadIcon />,
      },
      {
        id: 'tumbleblocks',
        label: 'Tetris',
        type: 'app',
        appKey: 'tumbleblocks',
        style: 'linear-gradient(135deg, #5e5ce6 0%, #3a38a0 100%)',
        icon: <TetrisGlyph />,
      },
      {
        id: 'mazemuncher',
        label: 'Pac-Man',
        type: 'app',
        appKey: 'mazemuncher',
        style: 'linear-gradient(135deg, #1b2a6b 0%, #0d1533 100%)',
        icon: <PacManGlyph />,
      },
    ],
  },
];

/* Real iOS dock: Phone / Safari / Messages / Spotify. Phone is
   intercepted before any app sheet opens (IPhoneHome.jsx) and just
   dials straight out via tel:. Safari reuses the Chrome Dino game's
   appKey — "opening Safari" launches the game, the joke being the
   point. Messages reuses the existing iMessage sheet. */
export const DOCK_APPS = [
  {
    id: 'phone',
    label: 'Phone',
    type: 'app',
    appKey: 'phone',
    style: 'linear-gradient(160deg, #6bde6b 0%, #2fb92f 100%)',
    icon: <PhoneIcon />,
  },
  {
    id: 'safari',
    label: 'Safari',
    type: 'app',
    appKey: 'chrome',
    style: 'linear-gradient(160deg, #eef3f8 0%, #d5dee6 100%)',
    icon: <SafariIcon />,
  },
  HOME_APPS.find((a) => a.id === 'imessage'),
  {
    id: 'spotify',
    label: 'Spotify',
    type: 'app',
    appKey: 'spotify',
    style: 'linear-gradient(160deg, #1ED760 0%, #128a3e 100%)',
    icon: <SpotifyIcon />,
  },
];

/* ─── Flat, searchable list — every home-screen app plus everything
   inside a folder, plus the dock-only apps (Phone/Safari/Spotify)
   that don't otherwise appear on the grid. Real iOS Spotlight finds
   apps buried in folders too, so this does the same. */
function flattenApps(items) {
  const out = [];
  for (const item of items) {
    if (item.type === 'folder') {
      out.push(...flattenApps(item.apps || []));
    } else {
      out.push(item);
    }
  }
  return out;
}

export const SEARCHABLE_APPS = [
  ...flattenApps(HOME_APPS),
  DOCK_APPS.find((a) => a.id === 'phone'),
  DOCK_APPS.find((a) => a.id === 'safari'),
  DOCK_APPS.find((a) => a.id === 'spotify'),
].filter(Boolean);
