/* ─── App definitions ──────────────────────────────────────────── */

const PortfolioIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="6" y="11" width="20" height="15" rx="2.5" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M11 11V9a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <line x1="6" y1="18" x2="26" y2="18" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const PersonIcon = () => (
  <svg width="30" height="32" viewBox="0 0 30 32" fill="none">
    <circle cx="15" cy="10" r="7" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M2 30c0-7.18 5.82-13 13-13s13 5.82 13 13" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const DocIcon = () => (
  <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
    <path d="M4 2h14l6 6v24H4z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <path d="M18 2v6h6" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="8" y1="15" x2="20" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="20" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="25" x2="16" y2="25" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const EnvelopeIcon = () => (
  <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
    <rect x="1" y="1" width="32" height="24" rx="3.5" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M1 5l16 10L33 5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const StarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 3l3.3 7.8 8.4.7-6.3 5.5 1.9 8.3-7.3-4.4-7.3 4.4 1.9-8.3L4.3 11.5l8.4-.7z"
      stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
    <path d="M4 3l22 13L4 29z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="white" fillOpacity="0.9"/>
  </svg>
);

const BrowserIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect x="1" y="1" width="30" height="30" rx="5" stroke="white" strokeWidth="2" fill="none"/>
    <line x1="1" y1="9" x2="31" y2="9" stroke="white" strokeWidth="1.5"/>
    <circle cx="6" cy="5" r="1.5" fill="white"/>
    <circle cx="11" cy="5" r="1.5" fill="white"/>
    <circle cx="16" cy="5" r="1.5" fill="white"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
    <circle cx="14" cy="5" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="4" cy="19" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="24" cy="19" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <line x1="10.4" y1="7.7" x2="7.6" y2="16.3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="17.6" y1="7.7" x2="20.4" y2="16.3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PrintIcon = () => (
  <svg width="34" height="32" viewBox="0 0 34 32" fill="none">
    <rect x="6" y="1" width="22" height="12" rx="2" stroke="white" strokeWidth="2" fill="none"/>
    <rect x="6" y="20" width="22" height="11" rx="2" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M6 13H4a3 3 0 0 0-3 3v6h6" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <path d="M28 13h2a3 3 0 0 1 3 3v6h-6" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <line x1="10" y1="24" x2="24" y2="24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="28" x2="20" y2="28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const GamepadIcon = () => (
  <svg width="36" height="26" viewBox="0 0 36 26" fill="none">
    <rect x="1" y="1" width="34" height="24" rx="12" stroke="white" strokeWidth="2" fill="none"/>
    <line x1="11" y1="9" x2="11" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="7" y1="13" x2="15" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="25" cy="10" r="2" fill="white"/>
    <circle cx="29" cy="14" r="2" fill="white"/>
  </svg>
);

const MineIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <circle cx="15" cy="15" r="8" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="15" cy="15" r="3" fill="white"/>
    <line x1="15" y1="1" x2="15" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="15" y1="24" x2="15" y2="29" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="15" x2="6" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <line x1="24" y1="15" x2="29" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <text x="3" y="24" fontFamily="-apple-system, sans-serif" fontSize="26" fontWeight="700" fill="white">M</text>
  </svg>
);

export const HOME_APPS = [
  {
    id: 'portfolio',
    label: 'Portfolio',
    appKey: 'portfolio',
    style: 'linear-gradient(145deg, #0d9ba8 0%, #056d77 100%)',
    icon: <PortfolioIcon />,
  },
  {
    id: 'about',
    label: 'About Me',
    appKey: 'about',
    style: 'linear-gradient(145deg, #1a3a5c 0%, #0d2240 100%)',
    icon: <PersonIcon />,
  },
  {
    id: 'resume',
    label: 'Resume',
    appKey: 'resume',
    style: 'linear-gradient(145deg, #2c2c2e 0%, #1c1c1e 100%)',
    icon: <DocIcon />,
  },
  {
    id: 'contact',
    label: 'Contact',
    appKey: 'contact',
    style: 'linear-gradient(145deg, #34c759 0%, #1a9e3a 100%)',
    icon: <EnvelopeIcon />,
  },
  {
    id: 'milestone',
    label: 'Milestone',
    appKey: 'milestone',
    imgSrc: '/assets/icons/desktop-milestone.png',
    style: 'linear-gradient(145deg, #0a1628 0%, #0d2040 100%)',
    icon: <MIcon />,
  },
  {
    id: 'branding',
    label: 'Branding',
    appKey: 'branding',
    style: 'linear-gradient(145deg, #7b2fff 0%, #5a1db8 100%)',
    icon: <StarIcon />,
  },
  {
    id: 'motion',
    label: 'Motion',
    appKey: 'motion',
    style: 'linear-gradient(145deg, #ff6b00 0%, #cc4d00 100%)',
    icon: <PlayIcon />,
  },
  {
    id: 'web-ui',
    label: 'Web + UI',
    appKey: 'web-ui',
    style: 'linear-gradient(145deg, #007aff 0%, #0056cc 100%)',
    icon: <BrowserIcon />,
  },
  {
    id: 'social',
    label: 'Social Media',
    appKey: 'social',
    style: 'linear-gradient(145deg, #ff375f 0%, #c9184a 100%)',
    icon: <ShareIcon />,
  },
  {
    id: 'print',
    label: 'Print + Info',
    appKey: 'print',
    style: 'linear-gradient(145deg, #636366 0%, #3a3a3c 100%)',
    icon: <PrintIcon />,
  },
  {
    id: 'games',
    label: 'Games',
    appKey: 'games',
    style: 'linear-gradient(145deg, #ffd60a 0%, #d4a800 100%)',
    icon: <GamepadIcon />,
  },
  {
    id: 'minesweeper',
    label: 'Minesweeper',
    appKey: 'minesweeper',
    imgSrc: '/assets/icons/desktop-minesweeper.png',
    style: 'linear-gradient(145deg, #48484a 0%, #2c2c2e 100%)',
    icon: <MineIcon />,
  },
];

export const DOCK_APPS = [
  HOME_APPS.find(a => a.id === 'portfolio'),
  HOME_APPS.find(a => a.id === 'about'),
  HOME_APPS.find(a => a.id === 'contact'),
  HOME_APPS.find(a => a.id === 'resume'),
];
