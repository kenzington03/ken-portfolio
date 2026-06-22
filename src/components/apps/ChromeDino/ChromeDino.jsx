import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ChromeDino.module.css';

const W = 640;
const H = 240;
const GROUND_Y = 180;
const DINO_X = 60;
const GRAVITY = 0.9;
const JUMP_V = -14;
const INITIAL_SPEED = 5.5;

/* ── Draw a proper Chrome T-Rex silhouette ── */
function drawDino(ctx, dinoY, frame, isDead) {
  const x = DINO_X;
  const y = dinoY;
  const c = isDead ? '#888' : '#535353';
  ctx.fillStyle = c;

  // --- body ---
  ctx.fillRect(x + 4, y + 6, 26, 18);

  // --- neck ---
  ctx.fillRect(x + 20, y - 2, 10, 10);

  // --- head ---
  ctx.fillRect(x + 22, y - 12, 18, 14);

  // --- jaw (open slightly) ---
  ctx.fillRect(x + 22, y + 2, 14, 4);

  // --- eye ---
  ctx.fillStyle = isDead ? '#aaa' : '#fff';
  ctx.fillRect(x + 34, y - 10, 5, 5);
  if (!isDead) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 36, y - 9, 3, 3);
  }

  ctx.fillStyle = c;

  // --- tail ---
  ctx.fillRect(x - 10, y + 10, 12, 6);
  ctx.fillRect(x - 16, y + 14, 8, 4);

  // --- arm (tiny, static) ---
  ctx.fillRect(x + 22, y + 14, 6, 4);

  // --- legs (animated) ---
  const leg = frame % 16 < 8;
  if (leg) {
    ctx.fillRect(x + 8, y + 24, 6, 14);
    ctx.fillRect(x + 8, y + 36, 10, 4);
    ctx.fillRect(x + 18, y + 24, 6, 8);
    ctx.fillRect(x + 18, y + 30, 10, 4);
  } else {
    ctx.fillRect(x + 8, y + 24, 6, 8);
    ctx.fillRect(x + 8, y + 30, 10, 4);
    ctx.fillRect(x + 18, y + 24, 6, 14);
    ctx.fillRect(x + 18, y + 36, 10, 4);
  }
}

/* ── Cactus ── */
function drawCactus(ctx, x, h) {
  ctx.fillStyle = '#535353';
  const cx = x;

  // main stem
  ctx.fillRect(cx + 4, GROUND_Y - h, 10, h);

  // left arm
  ctx.fillRect(cx - 8, GROUND_Y - h + 10, 12, 6);
  ctx.fillRect(cx - 8, GROUND_Y - h + 2, 6, 12);

  // right arm
  ctx.fillRect(cx + 14, GROUND_Y - h + 14, 12, 6);
  ctx.fillRect(cx + 20, GROUND_Y - h + 6, 6, 14);
}

/* ── Clouds ── */
function drawCloud(ctx, x, y) {
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(x, y, 40, 8);
  ctx.fillRect(x + 6, y - 4, 10, 4);
  ctx.fillRect(x + 20, y - 4, 12, 4);
}

export default function ChromeDino() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => {
    try { return Number(localStorage.getItem('dino-hi') || 0); } catch { return 0; }
  });
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const stateRef = useRef({
    dinoY: GROUND_Y - 42,
    dinoV: 0,
    onGround: true,
    obstacles: [],
    clouds: [{ x: 200, y: 40 }, { x: 450, y: 28 }],
    speed: INITIAL_SPEED,
    frame: 0,
    score: 0,
  });

  const resetState = () => ({
    dinoY: GROUND_Y - 42,
    dinoV: 0,
    onGround: true,
    obstacles: [],
    clouds: [{ x: 200, y: 40 }, { x: 450, y: 28 }],
    speed: INITIAL_SPEED,
    frame: 0,
    score: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (gameOver) {
      stateRef.current = resetState();
      setScore(0);
      setGameOver(false);
      setStarted(false);
      return;
    }
    setStarted(true);
    if (s.onGround) {
      s.dinoV = JUMP_V;
      s.onGround = false;
    }
  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;

    const loop = () => {
      const s = stateRef.current;

      if (started && !gameOver) {
        s.frame += 1;

        // dino physics
        s.dinoV += GRAVITY;
        s.dinoY += s.dinoV;
        if (s.dinoY >= GROUND_Y - 42) {
          s.dinoY = GROUND_Y - 42;
          s.dinoV = 0;
          s.onGround = true;
        }

        // speed up gradually
        s.speed = Math.min(12, INITIAL_SPEED + s.score * 0.06);

        // spawn obstacles
        const minInterval = Math.max(50, 100 - s.score * 2);
        if (s.frame % minInterval === 0 || (s.obstacles.length === 0 && s.frame > 40)) {
          if (s.obstacles.length === 0 || s.obstacles[s.obstacles.length - 1].x < W - 200) {
            s.obstacles.push({
              x: W + 10,
              h: 28 + Math.random() * 18,
            });
          }
        }

        s.obstacles.forEach((o) => { o.x -= s.speed; });
        s.obstacles = s.obstacles.filter((o) => o.x > -40);

        // clouds drift
        s.clouds.forEach((c) => { c.x -= s.speed * 0.25; });
        s.clouds = s.clouds.filter((c) => c.x > -60);
        if (s.clouds.length < 3 && Math.random() < 0.003) {
          s.clouds.push({ x: W + 10, y: 20 + Math.random() * 50 });
        }

        // collision
        for (const o of s.obstacles) {
          const dinoLeft = DINO_X + 4;
          const dinoRight = DINO_X + 30;
          const dinoTop = s.dinoY;
          const dinoBottom = s.dinoY + 42;
          const cactusLeft = o.x;
          const cactusRight = o.x + 18;
          const cactusTop = GROUND_Y - o.h;

          if (
            dinoRight - 4 > cactusLeft + 2 &&
            dinoLeft + 4 < cactusRight - 2 &&
            dinoBottom - 4 > cactusTop
          ) {
            const finalScore = s.score;
            if (finalScore > hi) {
              setHi(finalScore);
              try { localStorage.setItem('dino-hi', String(finalScore)); } catch { /* ignore */ }
            }
            setGameOver(true);
          }

          if (!o.scored && o.x + 18 < DINO_X) {
            o.scored = true;
            s.score += 1;
            setScore(s.score);
          }
        }
      }

      // bg
      ctx.fillStyle = '#f7f7f7';
      ctx.fillRect(0, 0, W, H);

      // clouds
      stateRef.current.clouds.forEach((c) => drawCloud(ctx, c.x, c.y));

      // ground line
      ctx.fillStyle = '#535353';
      ctx.fillRect(0, GROUND_Y + 2, W, 2);

      // ground texture dots
      ctx.fillStyle = '#d0d0d0';
      for (let gx = (stateRef.current.frame * stateRef.current.speed) % 20; gx < W; gx += 20) {
        ctx.fillRect(gx, GROUND_Y + 6, 4, 2);
      }

      stateRef.current.obstacles.forEach((o) => drawCactus(ctx, o.x, o.h));
      drawDino(ctx, stateRef.current.dinoY, started ? stateRef.current.frame : 0, gameOver);

      // HI / score display
      ctx.fillStyle = '#535353';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      const hiLabel = `HI ${String(hi).padStart(5, '0')}`;
      const scoreLabel = String(stateRef.current.score).padStart(5, '0');
      ctx.fillText(`${hiLabel}  ${scoreLabel}`, W - 16, 24);

      if (!started && !gameOver) {
        ctx.fillStyle = '#535353';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space or click to start', W / 2, 110);
      }
      if (gameOver) {
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, 90);
        ctx.font = '13px system-ui';
        ctx.fillText('Press Space or click to restart', W / 2, 112);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver, hi]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        jump();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [jump]);

  return (
    <div className={styles.page} data-game-window>
      <div className={styles.chromeBar}>
        <span className={styles.tab}>New Tab</span>
      </div>
      <div className={styles.gameArea}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={styles.canvas}
          onClick={jump}
          aria-label="Chrome Dino game"
        />
      </div>
    </div>
  );
}
