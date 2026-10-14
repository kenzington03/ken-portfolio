// Games on the iPhone: each one full screen, laid out and controlled as the
// game would be on a phone (tap, drag, swipe, on-screen pads), not a
// shrunken desktop window.

import ChromeDino from '../apps/ChromeDino/ChromeDino.jsx';
import FlappyBird from '../apps/FlappyBird/FlappyBird.jsx';
import MazeMuncher from '../apps/MazeMuncher/MazeMuncher.jsx';
import Minesweeper from '../apps/Minesweeper/Minesweeper.jsx';
import TumbleBlocks from '../apps/TumbleBlocks/TumbleBlocks.jsx';

const GAMES = {
  chrome: ChromeDino,
  flappy: FlappyBird,
  minesweeper: Minesweeper,
  tumbleblocks: TumbleBlocks,
  mazemuncher: MazeMuncher,
};

export default function MobileGame({ appKey }) {
  const Game = GAMES[appKey];
  if (!Game) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: appKey === 'minesweeper' ? 'auto' : 'hidden' }}>
      <Game mobile />
    </div>
  );
}
