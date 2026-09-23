import { PacManGlyph, TetrisGlyph } from '../components/icons/GameGlyphs.jsx';

/** Cute flat-illustration cat face for Buddy — pointed ears, whiskers,
    closed happy eyes, same style family as About Ken's cat icon. */
const CatGlyph = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <path d="M4 12L9 3L13 12Z" fill="#3a3a3c" />
    <path d="M26 12L21 3L17 12Z" fill="#3a3a3c" />
    <ellipse cx="15" cy="17" rx="11" ry="9.5" fill="#3a3a3c" />
    <path d="M9.5 14.5Q11 16 12.5 14.5" stroke="#F5D971" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M17.5 14.5Q19 16 20.5 14.5" stroke="#F5D971" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M14 18.5L16 18.5L15 19.8Z" fill="#E8A0A0" />
    <path d="M2 18H8M2 21H7.5M22 18H28M22.5 21H28" stroke="#8e8e93" strokeWidth="0.8" strokeLinecap="round" />
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
    icon: <CatGlyph />,
    bg: 'linear-gradient(135deg, #ffd60a 0%, #d9a406 100%)',
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
