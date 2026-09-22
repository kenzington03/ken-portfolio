import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverScreen from '../../shared/games/GameOverScreen.jsx';
import styles from './MazeMuncher.module.css';
import { isTypingTarget } from '../../../hooks/useGlobalKeyboard.js';

/* 13x11 symmetric maze. #=wall .=dot (space)=empty path P=power pellet.
   Kept deliberately simple/hand-verifiable rather than procedurally
   generated, so every row is provably 13 characters and every open
   cell is reachable. */
const MAZE_ROWS = [
  '#############',
  '#P.........P#',
  '#.###.#.###.#',
  '#...........#',
  '###.#.#.#.###',
  '#...........#',
  '#.###.#.###.#',
  '#...........#',
  '###.#.#.#.###',
  '#P.........P#',
  '#############',
];

const COLS = MAZE_ROWS[0].length;
const ROWS = MAZE_ROWS.length;
const CELL = 26;

const DIRS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const GHOST_COLORS = ['#ff453a', '#40c8e0', '#ff9f0a'];
const GHOST_START = [
  { x: 5, y: 1 },
  { x: 7, y: 1 },
  { x: 6, y: 9 },
];
const PLAYER_START = { x: 6, y: 5 };

const FRIGHTENED_TICKS = 45;

function parseMaze() {
  const grid = [];
  let dots = 0;
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      const ch = MAZE_ROWS[y][x];
      if (ch === '#') row.push('wall');
      else if (ch === '.') { row.push('dot'); dots += 1; }
      else if (ch === 'P') { row.push('power'); dots += 1; }
      else row.push('empty');
    }
    grid.push(row);
  }
  return { grid, dots };
}

function isOpen(grid, x, y) {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return false;
  return grid[y][x] !== 'wall';
}

function tickMsForLevel(level) {
  return Math.max(90, 170 - (level - 1) * 12);
}

function ghostCountForLevel(level) {
  return Math.min(GHOST_COLORS.length, 1 + Math.floor((level - 1) / 1));
}

export default function MazeMuncher() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef(null);
  const tickRef = useRef(null);

  const initLevel = useCallback((lvl) => {
    const { grid, dots } = parseMaze();
    return {
      grid,
      dotsLeft: dots,
      level: lvl,
      player: { ...PLAYER_START, dir: null, nextDir: null },
      ghosts: GHOST_START.slice(0, ghostCountForLevel(lvl)).map((g, i) => ({
        ...g,
        color: GHOST_COLORS[i],
        dir: [1, 0],
        frightTicks: 0,
        eaten: false,
      })),
      frightened: 0,
    };
  }, []);

  if (!stateRef.current) {
    stateRef.current = { ...initLevel(1), score: 0, lives: 3 };
  }

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const resetPositions = useCallback(() => {
    const s = stateRef.current;
    s.player = { ...PLAYER_START, dir: null, nextDir: null };
    s.ghosts.forEach((g, i) => {
      g.x = GHOST_START[i % GHOST_START.length].x;
      g.y = GHOST_START[i % GHOST_START.length].y;
      g.frightTicks = 0;
      g.eaten = false;
    });
    s.frightened = 0;
  }, []);

  const advanceGhost = useCallback((g, s) => {
    const opts = Object.values(DIRS).filter(([dx, dy]) => isOpen(s.grid, g.x + dx, g.y + dy));
    if (opts.length === 0) return;
    let choice;
    if (g.eaten) {
      // head back toward center to "respawn"
      choice = opts.sort((a, b) => {
        const da = Math.hypot(g.x + a[0] - 6, g.y + a[1] - 5);
        const db = Math.hypot(g.x + b[0] - 6, g.y + b[1] - 5);
        return da - db;
      })[0];
      if (Math.hypot(g.x - 6, g.y - 5) < 1.5) g.eaten = false;
    } else if (g.frightTicks > 0 || Math.random() < 0.25) {
      choice = opts[Math.floor(Math.random() * opts.length)];
    } else {
      choice = opts.sort((a, b) => {
        const da = Math.hypot(g.x + a[0] - s.player.x, g.y + a[1] - s.player.y);
        const db = Math.hypot(g.x + b[0] - s.player.x, g.y + b[1] - s.player.y);
        return da - db;
      })[0];
    }
    g.x += choice[0];
    g.y += choice[1];
    g.dir = choice;
    if (g.frightTicks > 0) g.frightTicks -= 1;
  }, []);

  const loseLife = useCallback(() => {
    const s = stateRef.current;
    s.lives -= 1;
    setLives(s.lives);
    if (s.lives <= 0) {
      stopTick();
      setGameOver(true);
    } else {
      resetPositions();
    }
  }, [stopTick, resetPositions]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const p = s.player;

    if (p.nextDir && isOpen(s.grid, p.x + DIRS[p.nextDir][0], p.y + DIRS[p.nextDir][1])) {
      p.dir = p.nextDir;
    }
    if (p.dir && isOpen(s.grid, p.x + DIRS[p.dir][0], p.y + DIRS[p.dir][1])) {
      p.x += DIRS[p.dir][0];
      p.y += DIRS[p.dir][1];
    }

    const cell = s.grid[p.y][p.x];
    if (cell === 'dot' || cell === 'power') {
      s.grid[p.y][p.x] = 'empty';
      s.dotsLeft -= 1;
      s.score += cell === 'power' ? 50 : 10;
      if (cell === 'power') {
        s.ghosts.forEach((g) => { if (!g.eaten) g.frightTicks = FRIGHTENED_TICKS; });
      }
      setScore(s.score);
    }

    const ghostsBefore = s.ghosts.map((g) => ({ x: g.x, y: g.y }));
    s.ghosts.forEach((g) => advanceGhost(g, s));

    for (let i = 0; i < s.ghosts.length; i++) {
      const g = s.ghosts[i];
      // Same cell now, or the player stepped onto the ghost's previous cell
      // (covers head-on swaps, where the two never share a cell after the tick).
      const hit =
        (g.x === p.x && g.y === p.y) ||
        (ghostsBefore[i].x === p.x && ghostsBefore[i].y === p.y);
      if (hit) {
        if (g.frightTicks > 0 && !g.eaten) {
          g.eaten = true;
          g.frightTicks = 0;
          s.score += 200;
          setScore(s.score);
        } else if (!g.eaten) {
          loseLife();
          return;
        }
      }
    }

    if (s.dotsLeft <= 0) {
      stopTick();
      const nextLevel = s.level + 1;
      const fresh = initLevel(nextLevel);
      stateRef.current = { ...fresh, score: s.score, lives: s.lives };
      setLevel(nextLevel);
      startTickRef.current(nextLevel);
    }
  }, [advanceGhost, loseLife, stopTick, initLevel]);

  const startTickRef = useRef(() => {});
  const startTick = useCallback(
    (lvl) => {
      stopTick();
      tickRef.current = setInterval(tick, tickMsForLevel(lvl));
    },
    [stopTick, tick]
  );
  startTickRef.current = startTick;

  useEffect(() => () => stopTick(), [stopTick]);

  const begin = useCallback(() => {
    if (started || gameOver) return;
    setStarted(true);
    startTick(stateRef.current.level);
  }, [started, gameOver, startTick]);

  const playAgain = useCallback(() => {
    stateRef.current = { ...initLevel(1), score: 0, lives: 3 };
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setStarted(true);
    startTick(1);
  }, [initLevel, startTick]);

  useEffect(() => {
    if (gameOver) return undefined;
    const onKey = (e) => {
      // Let text fields (Terminal, Claude, name entry) keep Space and arrows.
      if (isTypingTarget(e.target)) return;
      if (!started) {
        if (e.code === 'Space') { e.preventDefault(); begin(); }
        return;
      }
      if (DIRS[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        stateRef.current.player.nextDir = e.key;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [started, gameOver, begin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;
    let frame = 0;

    const draw = () => {
      frame += 1;
      const s = stateRef.current;
      const W = COLS * CELL;
      const H = ROWS * CELL;

      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, W, H);

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = s.grid[y][x];
          const cx = x * CELL + CELL / 2;
          const cy = y * CELL + CELL / 2;
          if (cell === 'wall') {
            ctx.fillStyle = '#1b2a6b';
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          } else if (cell === 'dot') {
            ctx.fillStyle = '#f5d76e';
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === 'power') {
            ctx.fillStyle = '#f5d76e';
            ctx.beginPath();
            ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ghosts
      s.ghosts.forEach((g) => {
        const cx = g.x * CELL + CELL / 2;
        const cy = g.y * CELL + CELL / 2;
        ctx.fillStyle = g.eaten ? 'rgba(255,255,255,0.25)' : g.frightTicks > 0 ? '#3b5bff' : g.color;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, CELL / 2 - 3, Math.PI, 0);
        ctx.lineTo(cx + CELL / 2 - 3, cy + CELL / 2 - 4);
        ctx.lineTo(cx, cy + CELL / 2 - 8);
        ctx.lineTo(cx - CELL / 2 + 3, cy + CELL / 2 - 4);
        ctx.closePath();
        ctx.fill();
        if (!g.eaten) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(cx - 4, cy - 4, 2.5, 0, Math.PI * 2);
          ctx.arc(cx + 4, cy - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // player
      const p = s.player;
      const cx = p.x * CELL + CELL / 2;
      const cy = p.y * CELL + CELL / 2;
      const chomp = started && !gameOver ? Math.abs(Math.sin(frame * 0.25)) * 0.28 : 0.1;
      let angle = 0;
      if (p.dir === 'ArrowLeft') angle = Math.PI;
      else if (p.dir === 'ArrowUp') angle = -Math.PI / 2;
      else if (p.dir === 'ArrowDown') angle = Math.PI / 2;
      ctx.fillStyle = '#ffd60a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, CELL / 2 - 2, angle + chomp * Math.PI, angle + (2 - chomp) * Math.PI);
      ctx.closePath();
      ctx.fill();

      if (!started && !gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, H / 2 - 24, W, 48);
        ctx.fillStyle = '#fff';
        ctx.font = '13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space to start', W / 2, H / 2);
        ctx.font = '10.5px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Arrow keys to move · eat the big dots to hunt ghosts', W / 2, H / 2 + 16);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver]);

  return (
    <div className={styles.wrap} data-game-window>
      <div className={styles.hud}>
        <span>Score: {score}</span>
        <span>Level: {level}</span>
        <span>Lives: {'●'.repeat(Math.max(0, lives))}</span>
      </div>
      <div className={styles.boardWrap}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className={styles.canvas}
          onClick={begin}
          aria-label="Pac-Man game"
        />
        <GameOverScreen
          open={gameOver}
          gameKey="mazemuncher"
          gameLabel="Pac-Man"
          score={score}
          level={level}
          extraStat={{ label: 'Level reached', value: level }}
          onPlayAgain={playAgain}
        />
      </div>
    </div>
  );
}
