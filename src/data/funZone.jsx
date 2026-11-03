import { BubbleGlyph, PacManGlyph, TetrisGlyph } from '../components/icons/GameGlyphs.jsx';

/** Kerning's face: the tuxedo cat who lives on the desktop. */
const CatGlyph = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M6 12 7.5 3l6 5.5zM26 12 24.5 3l-6 5.5z" fill="#141416" />
    <path d="M8 9.5 8.8 5l3 3zM24 9.5 23.2 5l-3 3z" fill="#f2a1a8" />
    <ellipse cx="16" cy="17" rx="11" ry="10" fill="#141416" />
    <path d="M16 15.5c-2 2.8-6 4-6 7.3 0 2 3 3.4 6 3.4s6-1.4 6-3.4c0-3.3-4-4.5-6-7.3z" fill="#f6f4ef" />
    <ellipse cx="11.2" cy="15.6" rx="2.5" ry="2.8" fill="#c9e05a" />
    <ellipse cx="20.8" cy="15.6" rx="2.5" ry="2.8" fill="#c9e05a" />
    <ellipse cx="11.2" cy="15.8" rx="0.9" ry="2.3" fill="#111" />
    <ellipse cx="20.8" cy="15.8" rx="0.9" ry="2.3" fill="#111" />
    <path d="M15 20.2h2L16 21.4z" fill="#f2a1a8" />
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
    id: 'bubbleshooter',
    label: 'Bubbles',
    appId: 'bubbleshooter',
    icon: <BubbleGlyph />,
    bg: 'linear-gradient(135deg, #2c2c6e 0%, #12123a 100%)',
    action: 'app',
    nudge: true,
  },
  {
    id: 'pet',
    label: 'Kerning',
    icon: <CatGlyph />,
    bg: 'linear-gradient(135deg, #e9e6df 0%, #bdb8ae 100%)',
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
  'bubbleshooter',
]);

/** Portfolio icon shared by dock and right-sidebar desktop icon. */
export const PORTFOLIO_ICON_SRC = '/assets/icons/desktop-web-ui.png';
