/** Bottom-left launcher cluster (above system dock). */
export const FUN_ZONE_ITEMS = [
  {
    id: 'minesweeper',
    label: 'Minesweeper',
    appId: 'minesweeper',
    src: '/assets/icons/desktop-minesweeper.png',
    action: 'app',
  },
  {
    id: 'flappybird',
    label: 'Flappy Bird',
    appId: 'flappybird',
    src: '/assets/icons/dock-flappy.svg',
    action: 'app',
  },
  {
    id: 'chromedino',
    label: 'Chrome',
    appId: 'chromedino',
    src: '/assets/icons/dock-chrome.svg',
    action: 'app',
  },
  {
    id: 'pet',
    label: 'Buddy',
    src: '/assets/oneko.gif',
    action: 'pet',
  },
];

export const GAME_APP_IDS = new Set(['flappybird', 'chromedino', 'minesweeper']);
