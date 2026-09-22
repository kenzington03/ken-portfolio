import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverScreen from '../../shared/games/GameOverScreen.jsx';
import styles from './TumbleBlocks.module.css';
import { isTypingTarget } from '../../../hooks/useGlobalKeyboard.js';

const COLS = 10;
const ROWS = 18;
const CELL = 22;

/* Each piece is one canonical shape in an NxN box; the other three
   rotations are derived at runtime with a generic 90° rotation instead
   of four hand-typed coordinate sets per piece (fewer places for a typo
   to hide). */
const PIECES = {
  I: { box: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]], color: '#40c8e0' },
  O: { box: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#ffd60a' },
  T: { box: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: '#bf5af2' },
  S: { box: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: '#30d158' },
  Z: { box: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#ff453a' },
  J: { box: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: '#0a84ff' },
  L: { box: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: '#ff9f0a' },
};
const PIECE_KEYS = Object.keys(PIECES);

function rotateCells(cells, box) {
  return cells.map(([x, y]) => [box - 1 - y, x]);
}

function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const def = PIECES[key];
  return {
    key,
    box: def.box,
    color: def.color,
    cells: def.cells,
    x: Math.floor((COLS - def.box) / 2),
    y: -1,
  };
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function collides(board, piece, cells, x, y) {
  return cells.some(([cx, cy]) => {
    const bx = x + cx;
    const by = y + cy;
    if (bx < 0 || bx >= COLS || by >= ROWS) return true;
    if (by < 0) return false;
    return board[by][bx] !== null;
  });
}

const LINE_SCORE = [0, 100, 300, 500, 800];
const LINES_PER_LEVEL = 10;

function levelForLines(lines) {
  return 1 + Math.floor(lines / LINES_PER_LEVEL);
}

function speedForLevel(level) {
  return Math.max(120, 800 - (level - 1) * 65);
}

export default function TumbleBlocks() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef(null);
  const tickRef = useRef(null);

  const initState = () => ({
    board: emptyBoard(),
    piece: randomPiece(),
    next: randomPiece(),
    score: 0,
    lines: 0,
  });

  if (!stateRef.current) stateRef.current = initState();

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const lockPiece = useCallback(() => {
    const s = stateRef.current;
    const { piece } = s;
    piece.cells.forEach(([cx, cy]) => {
      const bx = piece.x + cx;
      const by = piece.y + cy;
      if (by >= 0) s.board[by][bx] = piece.color;
    });

    let cleared = 0;
    s.board = s.board.filter((row) => {
      const full = row.every((cell) => cell !== null);
      if (full) cleared += 1;
      return !full;
    });
    while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(null));

    if (cleared > 0) {
      s.lines += cleared;
      s.score += LINE_SCORE[cleared] * levelForLines(s.lines);
      setLines(s.lines);
      setScore(s.score);
    }

    s.piece = s.next;
    s.piece.x = Math.floor((COLS - s.piece.box) / 2);
    s.piece.y = -1;
    s.next = randomPiece();

    if (collides(s.board, s.piece, s.piece.cells, s.piece.x, s.piece.y + 1)) {
      stopTick();
      setGameOver(true);
    }
  }, [stopTick]);

  const softDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s.piece) return;
    if (!collides(s.board, s.piece, s.piece.cells, s.piece.x, s.piece.y + 1)) {
      s.piece.y += 1;
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const startTick = useCallback(
    (level) => {
      stopTick();
      tickRef.current = setInterval(softDrop, speedForLevel(level));
    },
    [softDrop, stopTick]
  );

  useEffect(() => () => stopTick(), [stopTick]);

  const playAgain = useCallback(() => {
    stateRef.current = initState();
    setScore(0);
    setLines(0);
    setGameOver(false);
    setStarted(true);
    startTick(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = useCallback(() => {
    if (started || gameOver) return;
    setStarted(true);
    startTick(1);
  }, [started, gameOver, startTick]);

  useEffect(() => {
    const level = levelForLines(lines);
    if (started && !gameOver) startTick(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const move = useCallback((dx) => {
    const s = stateRef.current;
    if (!s.piece) return;
    if (!collides(s.board, s.piece, s.piece.cells, s.piece.x + dx, s.piece.y)) {
      s.piece.x += dx;
    }
  }, []);

  const rotate = useCallback(() => {
    const s = stateRef.current;
    if (!s.piece) return;
    const rotated = rotateCells(s.piece.cells, s.piece.box);
    if (!collides(s.board, s.piece, rotated, s.piece.x, s.piece.y)) {
      s.piece.cells = rotated;
    }
  }, []);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (!s.piece) return;
    while (!collides(s.board, s.piece, s.piece.cells, s.piece.x, s.piece.y + 1)) {
      s.piece.y += 1;
      s.score += 2;
    }
    setScore(s.score);
    lockPiece();
  }, [lockPiece]);

  useEffect(() => {
    if (gameOver) return undefined;
    const onKey = (e) => {
      // Let text fields (Terminal, Claude, name entry) keep Space and arrows.
      if (isTypingTarget(e.target)) return;
      if (!started) {
        if (e.code === 'Space' || e.code === 'ArrowDown') {
          e.preventDefault();
          begin();
        }
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.code === 'ArrowLeft') move(-1);
      else if (e.code === 'ArrowRight') move(1);
      else if (e.code === 'ArrowDown') softDrop();
      else if (e.code === 'ArrowUp') rotate();
      else if (e.code === 'Space') hardDrop();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [started, gameOver, begin, move, softDrop, rotate, hardDrop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;

    const draw = () => {
      const s = stateRef.current;
      const W = COLS * CELL;
      const H = ROWS * CELL;

      ctx.fillStyle = '#0c0c0e';
      ctx.fillRect(0, 0, W, H);

      // settled board
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = s.board[r][c];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      // active piece
      if (s.piece) {
        ctx.fillStyle = s.piece.color;
        s.piece.cells.forEach(([cx, cy]) => {
          const bx = s.piece.x + cx;
          const by = s.piece.y + cy;
          if (by >= 0) ctx.fillRect(bx * CELL + 1, by * CELL + 1, CELL - 2, CELL - 2);
        });
      }

      // grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }

      if (!started && !gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, H / 2 - 26, W, 52);
        ctx.fillStyle = '#fff';
        ctx.font = '13px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space to start', W / 2, H / 2 - 4);
        ctx.font = '11px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('← → move · ↑ rotate · ↓ soft drop', W / 2, H / 2 + 16);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver]);

  const level = levelForLines(lines);

  return (
    <div className={styles.wrap} data-game-window>
      <div className={styles.board}>
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          className={styles.canvas}
          onClick={begin}
          aria-label="Tetris game"
        />
        <GameOverScreen
          open={gameOver}
          gameKey="tumbleblocks"
          gameLabel="Tetris"
          score={score}
          level={level}
          extraStat={{ label: 'Lines cleared', value: lines }}
          onPlayAgain={playAgain}
        />
      </div>
      <div className={styles.sidebar}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>{score}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Level</span>
          <span className={styles.statValue}>{level}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Lines</span>
          <span className={styles.statValue}>{lines}</span>
        </div>
        <p className={styles.hint}>← → move<br />↑ rotate<br />↓ soft drop<br />Space hard drop</p>
      </div>
    </div>
  );
}
