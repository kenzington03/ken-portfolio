import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverScreen from '../../shared/games/GameOverScreen.jsx';
import styles from './FlappyBird.module.css';
import { isTypingTarget } from '../../../hooks/useGlobalKeyboard.js';

const W = 360;
const H = 520;
const BG_SKY = '#5EC0DE';
const BG_HILL = '#66C15A';
const BG_HILL_DARK = '#5AAE4F';
const BG_GROUND = '#DED895';
const BG_GRASS = '#77D24A';
const PIPE_COLOR = '#74BF2E';
const PIPE_LIGHT = '#8FDB47';
const PIPE_DARK = '#4A9A1A';
const BIRD_BODY = '#F9D71C';
const BIRD_WING = '#F5A623';
const OUTLINE = 'rgba(30, 26, 10, 0.85)';

const GRAVITY = 0.28;
const FLAP_V = -6.2;
const PIPE_W = 56;
const PIPE_INTERVAL = 88;
const BIRD_X = 72;
const BIRD_R = 13;
const GROUND_H = 56;

/* Difficulty ramps with score: every 6 points is a new level — pipes
   speed up and the gap narrows, capped so it stays fair/playable. */
const POINTS_PER_LEVEL = 6;
const BASE_PIPE_SPEED = 2.2;
const BASE_PIPE_GAP = 155;

function levelForScore(score) {
  return 1 + Math.floor(score / POINTS_PER_LEVEL);
}

function speedForLevel(level) {
  return Math.min(4.6, BASE_PIPE_SPEED + (level - 1) * 0.22);
}

function gapForLevel(level) {
  return Math.max(112, BASE_PIPE_GAP - (level - 1) * 6);
}

function drawBird(ctx, y, vy, frame) {
  const tilt = Math.max(-0.4, Math.min(0.9, vy * 0.06));
  // Wing flaps on its own cycle, independent of falling/rising, like the
  // original's sprite-sheet flap — not tied to velocity.
  const wingFlap = Math.sin(frame * 0.35) * 5;

  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';

  // body
  ctx.fillStyle = BIRD_BODY;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_R + 2, BIRD_R, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // wing
  ctx.fillStyle = BIRD_WING;
  ctx.beginPath();
  ctx.ellipse(-3, 4 + wingFlap * 0.3, 8, 5 - Math.abs(wingFlap) * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // eye white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(7, -4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // pupil
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(8.5, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = '#E8833A';
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.lineTo(20, 0);
  ctx.lineTo(12, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// A cylindrical highlight (left third lighter, right edge darker) plus a
// black outline on every rect is what makes the original's pipes read as
// 3D tubes instead of flat green rectangles.
function drawPipeBody(ctx, x, y, w, h) {
  if (h <= 0) return;
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PIPE_LIGHT;
  ctx.fillRect(x + 4, y, w * 0.28, h);
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(x + w - 6, y, 6, h);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawPipeCap(ctx, x, y, w, h) {
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = PIPE_LIGHT;
  ctx.fillRect(x + 5, y + 2, w * 0.22, h - 4);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawPipe(ctx, x, gapY, gap, canvasH) {
  const capH = 18;
  const capW = PIPE_W + 8;
  const capX = x - (capW - PIPE_W) / 2;

  drawPipeBody(ctx, x, 0, PIPE_W, gapY - capH);
  drawPipeCap(ctx, capX, gapY - capH, capW, capH);

  const botY = gapY + gap;
  drawPipeCap(ctx, capX, botY, capW, capH);
  drawPipeBody(ctx, x, botY + capH, PIPE_W, canvasH - botY - capH);
}

// Distant hill silhouette, scrolling slower than the pipes for parallax
// depth — the original's midground layer between sky and ground.
function drawHills(ctx, hillX) {
  const y = H - GROUND_H;
  const hillW = 120;
  const offset = hillX % hillW;

  ctx.fillStyle = BG_HILL_DARK;
  ctx.fillRect(0, y - 34, W, 34);

  ctx.fillStyle = BG_HILL;
  for (let hx = -hillW + offset; hx < W + hillW; hx += hillW) {
    ctx.beginPath();
    ctx.moveTo(hx, y);
    ctx.quadraticCurveTo(hx + hillW / 2, y - 60, hx + hillW, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGround(ctx, groundX) {
  const y = H - GROUND_H;

  ctx.fillStyle = BG_GROUND;
  ctx.fillRect(0, y, W, GROUND_H);

  // grass strip on top, outlined like the rest of the sprite work
  ctx.fillStyle = BG_GRASS;
  ctx.fillRect(0, y, W, 10);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();

  // scrolling diagonal dirt hatching, not just dashed rectangles
  const stripeW = 24;
  const offset = groundX % stripeW;
  ctx.strokeStyle = '#C8B428';
  ctx.lineWidth = 3;
  for (let sx = -stripeW + offset; sx < W + GROUND_H; sx += stripeW) {
    ctx.beginPath();
    ctx.moveTo(sx, y + 10);
    ctx.lineTo(sx - GROUND_H, H);
    ctx.stroke();
  }
}

export default function FlappyBird() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef(null);

  const initState = () => ({
    birdY: H / 2 - 20,
    birdV: 0,
    pipes: [
      {
        x: W + 20,
        gapY: 100 + Math.random() * (H - GROUND_H - BASE_PIPE_GAP - 120),
        gap: BASE_PIPE_GAP,
      },
    ],
    groundX: 0,
    hillX: 0,
    frame: 0,
    score: 0,
  });

  if (!stateRef.current) stateRef.current = initState();

  const playAgain = useCallback(() => {
    stateRef.current = initState();
    setScore(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  const flap = useCallback(() => {
    if (gameOver) return;
    setStarted(true);
    stateRef.current.birdV = FLAP_V;
  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;

    const loop = () => {
      const s = stateRef.current;

      if (started && !gameOver) {
        const level = levelForScore(s.score);
        const speed = speedForLevel(level);
        const gap = gapForLevel(level);

        s.birdV += GRAVITY;
        s.birdY += s.birdV;
        s.frame += 1;
        s.groundX = (s.groundX + speed) % 80;
        // Hills scroll slower than the ground/pipes for parallax depth.
        s.hillX = (s.hillX + speed * 0.35) % 120;

        if (s.frame % PIPE_INTERVAL === 0) {
          s.pipes.push({
            x: W + PIPE_W,
            gapY: 90 + Math.random() * (H - GROUND_H - gap - 110),
            gap,
          });
        }

        s.pipes.forEach((p) => { p.x -= speed; });
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 10);

        const capW = PIPE_W + 8;
        for (const p of s.pipes) {
          const inX = BIRD_X + BIRD_R > p.x - (capW - PIPE_W) / 2 && BIRD_X - BIRD_R < p.x + capW - (capW - PIPE_W) / 2;
          if (inX && (s.birdY - BIRD_R < p.gapY || s.birdY + BIRD_R > p.gapY + p.gap)) {
            setGameOver(true);
          }
          if (!p.scored && p.x + PIPE_W < BIRD_X) {
            p.scored = true;
            s.score += 1;
            setScore(s.score);
          }
        }

        if (s.birdY + BIRD_R > H - GROUND_H || s.birdY - BIRD_R < 0) {
          setGameOver(true);
        }
      }

      // sky
      ctx.fillStyle = BG_SKY;
      ctx.fillRect(0, 0, W, H);

      // clouds (static decorative)
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      [[60, 80], [180, 50], [290, 100]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 6, 16, 0, Math.PI * 2);
        ctx.arc(cx + 42, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      });

      drawHills(ctx, s.hillX);
      s.pipes.forEach((p) => drawPipe(ctx, p.x, p.gapY, p.gap, H - GROUND_H));
      drawGround(ctx, s.groundX);
      drawBird(ctx, s.birdY, s.birdV, s.frame);

      // score
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 3;
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.strokeText(String(s.score), W / 2, 52);
      ctx.fillText(String(s.score), W / 2, 52);

      // level indicator
      const level = levelForScore(s.score);
      if (level > 1) {
        ctx.font = 'bold 12px system-ui';
        ctx.strokeText(`Level ${level}`, W / 2, 72);
        ctx.fillText(`Level ${level}`, W / 2, 72);
      }

      if (!started && !gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(W / 2 - 110, H / 2 - 22, 220, 44);
        ctx.fillStyle = '#fff';
        ctx.font = '15px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Space to start', W / 2, H / 2 + 5);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver]);

  useEffect(() => {
    // While the game-over overlay is up, Space belongs to the name-entry
    // field (Play Again is a button, not a keybind) — don't intercept it.
    if (gameOver) return undefined;
    const onKey = (e) => {
      // Let text fields (Terminal, Claude, name entry) keep Space and arrows.
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        flap();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [flap, gameOver]);

  return (
    <div className={styles.wrap} data-game-window>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className={styles.canvas}
        onClick={flap}
        aria-label="Flappy Bird game"
      />
      <GameOverScreen
        open={gameOver}
        gameKey="flappybird"
        gameLabel="Flappy Bird"
        score={score}
        level={levelForScore(score) > 1 ? levelForScore(score) : undefined}
        onPlayAgain={playAgain}
      />
    </div>
  );
}
