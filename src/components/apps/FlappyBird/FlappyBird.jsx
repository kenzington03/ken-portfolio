import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FlappyBird.module.css';

const W = 360;
const H = 520;
const BG_SKY = '#5EC0DE';
const BG_GROUND = '#DED895';
const PIPE_COLOR = '#74BF2E';
const PIPE_DARK = '#4A9A1A';
const BIRD_BODY = '#F9D71C';
const BIRD_WING = '#F5A623';

const GRAVITY = 0.28;
const FLAP_V = -6.2;
const PIPE_SPEED = 2.2;
const PIPE_GAP = 155;
const PIPE_W = 56;
const PIPE_INTERVAL = 88;
const BIRD_X = 72;
const BIRD_R = 13;
const GROUND_H = 56;

function drawBird(ctx, y, vy) {
  const tilt = Math.max(-0.4, Math.min(0.9, vy * 0.06));
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(tilt);

  // body
  ctx.fillStyle = BIRD_BODY;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_R + 2, BIRD_R, 0, 0, Math.PI * 2);
  ctx.fill();

  // wing
  ctx.fillStyle = BIRD_WING;
  ctx.beginPath();
  ctx.ellipse(-3, 4, 8, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // eye white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(7, -4, 4.5, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.restore();
}

function drawPipe(ctx, x, gapY, canvasH) {
  const capH = 18;
  const capW = PIPE_W + 8;

  // top pipe body
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x, 0, PIPE_W, gapY - capH);

  // top pipe cap
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(x - (capW - PIPE_W) / 2, gapY - capH, capW, capH);
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x - (capW - PIPE_W) / 2 + 2, gapY - capH + 2, capW - 4, capH - 4);

  const botY = gapY + PIPE_GAP;

  // bottom pipe cap
  ctx.fillStyle = PIPE_DARK;
  ctx.fillRect(x - (capW - PIPE_W) / 2, botY, capW, capH);
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x - (capW - PIPE_W) / 2 + 2, botY + 2, capW - 4, capH - 4);

  // bottom pipe body
  ctx.fillStyle = PIPE_COLOR;
  ctx.fillRect(x, botY + capH, PIPE_W, canvasH - botY - capH);
}

function drawGround(ctx, groundX) {
  const y = H - GROUND_H;

  ctx.fillStyle = BG_GROUND;
  ctx.fillRect(0, y, W, GROUND_H);

  ctx.fillStyle = '#C8B428';
  ctx.fillRect(0, y, W, 4);

  // animated stripes
  const stripeW = 40;
  const offset = groundX % stripeW;
  ctx.fillStyle = '#C8B428';
  for (let sx = -stripeW + offset; sx < W; sx += stripeW) {
    ctx.fillRect(sx, y + 6, 20, 3);
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
    pipes: [{ x: W + 20, gapY: 100 + Math.random() * (H - GROUND_H - PIPE_GAP - 120) }],
    groundX: 0,
    frame: 0,
    score: 0,
  });

  if (!stateRef.current) stateRef.current = initState();

  const flap = useCallback(() => {
    if (gameOver) {
      stateRef.current = initState();
      setScore(0);
      setGameOver(false);
      setStarted(false);
      return;
    }
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
        s.birdV += GRAVITY;
        s.birdY += s.birdV;
        s.frame += 1;
        s.groundX = (s.groundX + PIPE_SPEED) % 80;

        if (s.frame % PIPE_INTERVAL === 0) {
          s.pipes.push({
            x: W + PIPE_W,
            gapY: 90 + Math.random() * (H - GROUND_H - PIPE_GAP - 110),
          });
        }

        s.pipes.forEach((p) => { p.x -= PIPE_SPEED; });
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 10);

        const capW = PIPE_W + 8;
        for (const p of s.pipes) {
          const inX = BIRD_X + BIRD_R > p.x - (capW - PIPE_W) / 2 && BIRD_X - BIRD_R < p.x + capW - (capW - PIPE_W) / 2;
          if (inX && (s.birdY - BIRD_R < p.gapY || s.birdY + BIRD_R > p.gapY + PIPE_GAP)) {
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

      s.pipes.forEach((p) => drawPipe(ctx, p.x, p.gapY, H - GROUND_H));
      drawGround(ctx, s.groundX);
      drawBird(ctx, s.birdY, s.birdV);

      // score
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 3;
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.strokeText(String(s.score), W / 2, 52);
      ctx.fillText(String(s.score), W / 2, 52);

      if (!started && !gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(W / 2 - 110, H / 2 - 22, 220, 44);
        ctx.fillStyle = '#fff';
        ctx.font = '15px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Click or Space to start', W / 2, H / 2 + 5);
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(W / 2 - 110, H / 2 - 22, 220, 44);
        ctx.fillStyle = '#fff';
        ctx.font = '15px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over — tap to restart', W / 2, H / 2 + 5);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        flap();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [flap]);

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
    </div>
  );
}
