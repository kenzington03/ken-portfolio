import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverScreen from '../../shared/games/GameOverScreen.jsx';
import { isTypingTarget } from '../../../hooks/useGlobalKeyboard.js';
import styles from './BubbleShooter.module.css';

/* Bubble Shooter: aim, shoot, and land a bubble next to two or more of its
   colour to pop the group; anything left hanging falls with it. Every few
   misses the ceiling comes down a row. Clear the board to win; let a bubble
   reach the line and it is over. Mouse to aim and click to shoot, or the
   arrow keys and Space. */

const R = 15; // a bubble's radius
const D = R * 2;
const COLS = 13;
const ROW_H = R * Math.sqrt(3); // hex rows sit this far apart
const W = COLS * D + R;
const H = 560;
const LOSE_Y = H - 92; // a bubble below this line ends the game
const SHOOTER = { x: W / 2, y: H - 46 };
const SPEED = 900; // px per second
const START_ROWS = 6;
const MISSES_PER_ROW = 5;
const COLORS = ['#ff453a', '#ffd60a', '#30d158', '#0a84ff', '#bf5af2'];
const MIN_AIM = 0.16; // radians off the horizontal, each side

// The board: rows of cells; odd rows (with `shift`) sit half a bubble in.
const cellsIn = (r, shift) => ((r + shift) % 2 ? COLS - 1 : COLS);
const cellX = (r, c, shift) => R + c * D + ((r + shift) % 2 ? R : 0);
const cellY = (r) => R + r * ROW_H;

function neighbours(r, c, shift) {
  const odd = (r + shift) % 2 === 1;
  const d = odd ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]] : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  return d.map(([dr, dc]) => [r + dr, c + dc]);
}

const randomColor = (pool) => pool[Math.floor(Math.random() * pool.length)];

function newBoard() {
  const rows = [];
  for (let r = 0; r < START_ROWS; r += 1) rows.push(Array.from({ length: cellsIn(r, 0) }, () => randomColor(COLORS)));
  return { rows, shift: 0 };
}

export default function BubbleShooter() {
  const canvasRef = useRef(null);
  const game = useRef(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(null); // null, 'won' or 'lost'

  const reset = useCallback(() => {
    const board = newBoard();
    game.current = {
      board,
      aim: -Math.PI / 2,
      shot: null,
      current: randomColor(COLORS),
      next: randomColor(COLORS),
      misses: 0,
      score: 0,
      falling: [],
      pops: [],
      done: false,
    };
    setScore(0);
    setOver(null);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  // Colours still on the board: the next bubbles only come in those.
  const live = (board) => {
    const set = new Set();
    board.rows.forEach((row) => row.forEach((c) => c && set.add(c)));
    return set.size ? [...set] : COLORS;
  };

  const shoot = useCallback(() => {
    const g = game.current;
    if (!g || g.shot || g.done) return;
    g.shot = { x: SHOOTER.x, y: SHOOTER.y, vx: Math.cos(g.aim) * SPEED, vy: Math.sin(g.aim) * SPEED, color: g.current };
    g.current = g.next;
    g.next = randomColor(live(g.board));
  }, []);

  // Where the shot sticks: the free cell nearest to it, next to the bubble it
  // hit (or in the top row).
  const land = (g) => {
    const { board, shot } = g;
    const { rows, shift } = board;
    let best = null;
    const rr = Math.max(0, Math.round((shot.y - R) / ROW_H));
    for (let r = Math.max(0, rr - 2); r <= rr + 2; r += 1) {
      for (let c = 0; c < cellsIn(r, shift); c += 1) {
        if (rows[r]?.[c]) continue;
        const touches = r === 0 || neighbours(r, c, shift).some(([nr, nc]) => rows[nr]?.[nc]);
        if (!touches) continue;
        const d = Math.hypot(cellX(r, c, shift) - shot.x, cellY(r) - shot.y);
        if (!best || d < best.d) best = { r, c, d };
      }
    }
    if (!best) return;
    while (rows.length <= best.r) rows.push(Array.from({ length: cellsIn(rows.length, shift) }, () => null));
    rows[best.r][best.c] = shot.color;

    // The group of its colour: three or more pop.
    const key = (r, c) => `${r},${c}`;
    const group = [];
    const seen = new Set([key(best.r, best.c)]);
    const stack = [[best.r, best.c]];
    while (stack.length) {
      const [r, c] = stack.pop();
      group.push([r, c]);
      neighbours(r, c, shift).forEach(([nr, nc]) => {
        if (rows[nr]?.[nc] === shot.color && !seen.has(key(nr, nc))) {
          seen.add(key(nr, nc));
          stack.push([nr, nc]);
        }
      });
    }
    if (group.length >= 3) {
      group.forEach(([r, c]) => {
        g.pops.push({ x: cellX(r, c, shift), y: cellY(r), color: rows[r][c], t: 0 });
        rows[r][c] = null;
      });
      g.score += group.length * 10;
      // Anything no longer hanging from the ceiling falls.
      const held = new Set();
      const queue = [];
      rows[0]?.forEach((v, c) => {
        if (v) {
          held.add(key(0, c));
          queue.push([0, c]);
        }
      });
      while (queue.length) {
        const [r, c] = queue.pop();
        neighbours(r, c, shift).forEach(([nr, nc]) => {
          if (rows[nr]?.[nc] && !held.has(key(nr, nc))) {
            held.add(key(nr, nc));
            queue.push([nr, nc]);
          }
        });
      }
      let dropped = 0;
      rows.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v && !held.has(key(r, c))) {
            g.falling.push({ x: cellX(r, c, shift), y: cellY(r), vy: 0, vx: (Math.random() - 0.5) * 120, color: v });
            rows[r][c] = null;
            dropped += 1;
          }
        })
      );
      g.score += dropped * 20;
    } else {
      g.misses += 1;
      // The ceiling comes down a row.
      if (g.misses >= MISSES_PER_ROW) {
        g.misses = 0;
        board.shift = 1 - board.shift;
        rows.unshift(Array.from({ length: cellsIn(0, board.shift) }, () => randomColor(live(board))));
      }
    }
    while (rows.length && rows[rows.length - 1].every((v) => !v)) rows.pop();
    setScore(g.score);
    if (!rows.some((row) => row.some(Boolean))) {
      g.done = true;
      setOver('won');
    } else if (rows.some((row, r) => row.some(Boolean) && cellY(r) + R > LOSE_Y)) {
      g.done = true;
      setOver('lost');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bubble = (x, y, color, alpha = 1, r = R) => {
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, color);
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const g = game.current;
      if (!g) return;
      const { rows, shift } = g.board;

      // The shot: off the side walls, sticking on the ceiling or a bubble.
      if (g.shot) {
        const s = g.shot;
        const steps = 4;
        for (let i = 0; i < steps && g.shot; i += 1) {
          s.x += (s.vx * dt) / steps;
          s.y += (s.vy * dt) / steps;
          if (s.x < R) {
            s.x = R;
            s.vx = Math.abs(s.vx);
          }
          if (s.x > W - R) {
            s.x = W - R;
            s.vx = -Math.abs(s.vx);
          }
          const hit =
            s.y <= R ||
            rows.some((row, r) => row.some((v, c) => v && Math.hypot(cellX(r, c, shift) - s.x, cellY(r) - s.y) < D * 0.88));
          if (hit) {
            land(g);
            g.shot = null;
          }
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#101014';
      ctx.fillRect(0, 0, W, H);
      // The line not to cross.
      ctx.strokeStyle = 'rgba(255,69,58,0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, LOSE_Y);
      ctx.lineTo(W, LOSE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      rows.forEach((row, r) => row.forEach((v, c) => v && bubble(cellX(r, c, shift), cellY(r), v)));

      // Pops grow and fade; dropped bubbles fall away.
      g.pops = g.pops.filter((p) => {
        p.t += dt;
        const k = p.t / 0.22;
        if (k >= 1) return false;
        bubble(p.x, p.y, p.color, 1 - k, R * (1 + k * 0.5));
        return true;
      });
      g.falling = g.falling.filter((f) => {
        f.vy += 1800 * dt;
        f.y += f.vy * dt;
        f.x += f.vx * dt;
        bubble(f.x, f.y, f.color, 0.9);
        return f.y < H + R;
      });

      // The aim: a dotted line, bending off the walls.
      if (!g.done) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        let x = SHOOTER.x;
        let y = SHOOTER.y;
        let vx = Math.cos(g.aim);
        const vy = Math.sin(g.aim);
        for (let i = 0; i < 40 && y > 0; i += 1) {
          x += vx * 12;
          y += vy * 12;
          if (x < R || x > W - R) vx = -vx;
          if (i > 1 && i % 2 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (g.shot) bubble(g.shot.x, g.shot.y, g.shot.color);
      else if (!g.done) bubble(SHOOTER.x, SHOOTER.y, g.current);
      // Up next, and the misses left before the ceiling drops.
      bubble(SHOOTER.x - 64, SHOOTER.y + 14, g.next, 1, R * 0.7);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '600 10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT', SHOOTER.x - 64, SHOOTER.y + 38);
      for (let i = 0; i < MISSES_PER_ROW; i += 1) {
        ctx.fillStyle = i < MISSES_PER_ROW - g.misses ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(SHOOTER.x + 52 + i * 10, SHOOTER.y + 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aimAt = (e) => {
    const g = game.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!g || !rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const a = Math.atan2(y - SHOOTER.y, x - SHOOTER.x);
    g.aim = Math.max(-Math.PI + MIN_AIM, Math.min(-MIN_AIM, a > Math.PI / 2 ? -Math.PI + MIN_AIM : a > 0 ? -MIN_AIM : a));
  };

  // Keys: left and right to aim, Space or Up to shoot.
  useEffect(() => {
    const onKey = (e) => {
      if (isTypingTarget(e.target)) return;
      const g = game.current;
      if (!g) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        g.aim = Math.max(-Math.PI + MIN_AIM, Math.min(-MIN_AIM, g.aim + (e.key === 'ArrowLeft' ? -0.06 : 0.06)));
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        shoot();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shoot]);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span>Bubble Shooter</span>
        <span className={styles.score}>{score}</span>
      </div>
      <div className={styles.board} style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvasRef} className={styles.canvas} onPointerMove={aimAt} onPointerDown={(e) => (aimAt(e), shoot())} />
        <GameOverScreen
          open={!!over}
          won={over === 'won'}
          gameKey="bubbleshooter"
          gameLabel="Bubble Shooter"
          score={score}
          onPlayAgain={reset}
        />
      </div>
    </div>
  );
}
