import { PacManGlyph, TetrisGlyph } from '../components/icons/GameGlyphs.jsx';

/** Cute flat-illustration dog face for Buddy — white/cream (Samoyed-style)
    fur so it reads as a dog, not a brown bear. Floppy ears, snout, closed
    happy eyes, same "friendly emoji-face" style as About Ken's cat icon. */
const DogGlyph = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <ellipse cx="6" cy="10" rx="4.5" ry="6" fill="#E8E6E0" transform="rotate(-25 6 10)" />
    <ellipse cx="24" cy="10" rx="4.5" ry="6" fill="#E8E6E0" transform="rotate(25 24 10)" />
    <ellipse cx="15" cy="17" rx="10.5" ry="9" fill="#FAF8F4" />
    <ellipse cx="15" cy="20" rx="5.5" ry="4.5" fill="#FFFFFF" />
    <path d="M11.5 15.5Q13 17 15 15.5" stroke="#2A2A2A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <path d="M15 15.5Q17 17 18.5 15.5" stroke="#2A2A2A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <ellipse cx="15" cy="19.5" rx="2.1" ry="1.5" fill="#2A2A2A" />
  </svg>
);

/** Bottom-left launcher cluster (above system dock). */
export const FUN_ZONE_ITEMS = [
  {
    id: 'minesweeper',
    label: 'Minesweeper',
    appId: 'minesweeper',
    src: '/assets/icons/desktop-minesweeper.png',
    action: 'app',
    nudge: true,
  },
  {
    id: 'flappybird',
    label: 'Flappy Bird',
    appId: 'flappybird',
    src: '/assets/icons/dock-flappy.svg',
    action: 'app',
    nudge: true,
  },
  {
    id: 'chromedino',
    label: 'Chrome',
    appId: 'chromedino',
    src: '/assets/icons/desktop-chrome.png',
    action: 'app',
    nudge: true,
  },
  {
    id: 'tumbleblocks',
    label: 'Tetris',
    appId: 'tumbleblocks',
    icon: <TetrisGlyph />,
    bg: 'linear-gradient(135deg, #5e5ce6 0%, #3a38a0 100%)',
    action: 'app',
    nudge: true,
  },
  {
    id: 'mazemuncher',
    label: 'Pac-Man',
    appId: 'mazemuncher',
    icon: <PacManGlyph />,
    bg: 'linear-gradient(135deg, #1b2a6b 0%, #0d1533 100%)',
    action: 'app',
    nudge: true,
  },
  {
    id: 'pet',
    label: 'Buddy',
    icon: <DogGlyph />,
    bg: 'linear-gradient(135deg, #6E7A87 0%, #3E4650 100%)',
    action: 'pet',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    appId: 'terminal',
    src: '/assets/icons/dock-terminal.png',
    action: 'app',
    nudge: true,
  },
];

export const GAME_APP_IDS = new Set([
  'flappybird',
  'chromedino',
  'minesweeper',
  'tumbleblocks',
  'mazemuncher',
]);

/** Portfolio icon shared by dock and right-sidebar desktop icon. */
export const PORTFOLIO_ICON_SRC = '/assets/icons/desktop-web-ui.png';
