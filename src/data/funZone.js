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
    id: 'pet',
    label: 'Buddy',
    src: '/assets/oneko.gif',
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

export const GAME_APP_IDS = new Set(['flappybird', 'chromedino', 'minesweeper']);

/** Portfolio icon shared by dock and right-sidebar desktop icon. */
export const PORTFOLIO_ICON_SRC = '/assets/icons/desktop-web-ui.png';
