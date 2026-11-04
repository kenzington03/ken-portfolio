import { BubbleGlyph, PacManGlyph, TetrisGlyph } from '../components/icons/GameGlyphs.jsx';

/** The games (and Toothless), on his cat castle bottom left. */
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
    src: '/assets/icons/flappy-bird.png',
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
    label: 'Toothless',
    src: '/assets/icons/toothless.png',
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
