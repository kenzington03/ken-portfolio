import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ChromeDino.module.css';

const GROUND_Y = 200;
const DINO_X = 50;
const GRAVITY = 0.6;
const JUMP = -11;

function drawDino(ctx, y, frame) {
  ctx.fillStyle = '#535353';
  const leg = frame % 20 < 10 ? 0 : 4;
  ctx.fillRect(DINO_X, y, 20, 24);
  ctx.fillRect(DINO_X + 14, y - 8, 10, 10);
  ctx.fillRect(DINO_X + 4, y + 24, 6, 6 + leg);
  ctx.fillRect(DINO_X + 12, y + 24, 6, 6 + (leg ? 0 : 4));
}

function drawCactus(ctx, x) {
  ctx.fillStyle = '#535353';
  ctx.fillRect(x, GROUND_Y - 30, 12, 30);
  ctx.fillRect(x - 8, GROUND_Y - 22, 8, 8);
  ctx.fillRect(x + 12, GROUND_Y - 18, 8, 8);
}

export default function ChromeDino() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => {
    try {
      return Number(localStorage.getItem('dino-hi') || 0);
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef({
    dinoY: GROUND_Y - 24,
    dinoV: 0,
    onGround: true,
    obstacles: [],
    speed: 6,
    frame: 0,
    score: 0,
    anim: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (gameOver) {
      stateRef.current = {
        dinoY: GROUND_Y - 24,
        dinoV: 0,
        onGround: true,
        obstacles: [],
        speed: 6,
        frame: 0,
        score: 0,
        anim: 0,
      };
      setScore(0);
      setGameOver(false);
      setStarted(false);
      return;
    }
    setStarted(true);
    if (s.onGround) {
      s.dinoV = JUMP;
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
      const w = canvas.width;

      if (started && !gameOver) {
        s.frame += 1;
        s.anim += 1;
        s.dinoV += GRAVITY;
        s.dinoY += s.dinoV;
        if (s.dinoY >= GROUND_Y - 24) {
          s.dinoY = GROUND_Y - 24;
          s.dinoV = 0;
          s.onGround = true;
        }

        if (s.frame % Math.max(40, 90 - s.score) === 0) {
          s.obstacles.push({ x: w + 10 });
        }

        s.obstacles.forEach((o) => {
          o.x -= s.speed;
        });
        s.obstacles = s.obstacles.filter((o) => o.x > -20);

        if (s.frame % 100 === 0) {
          s.speed = Math.min(12, s.speed + 0.15);
        }

        for (const o of s.obstacles) {
          if (o.x < DINO_X + 20 && o.x + 12 > DINO_X && s.dinoY + 24 > GROUND_Y - 30) {
            setGameOver(true);
            if (s.score > hi) {
              setHi(s.score);
              try {
                localStorage.setItem('dino-hi', String(s.score));
              } catch {
                /* ignore */
              }
            }
          }
          if (!o.scored && o.x + 12 < DINO_X) {
            o.scored = true;
            s.score += 1;
            setScore(s.score);
          }
        }
      }

      ctx.fillStyle = '#f7f7f7';
      ctx.fillRect(0, 0, w, canvas.height);
      ctx.strokeStyle = '#535353';
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 1);
      ctx.lineTo(w, GROUND_Y + 1);
      ctx.stroke();

      s.obstacles.forEach((o) => drawCactus(ctx, o.x));
      drawDino(ctx, s.dinoY, s.anim);

      ctx.fillStyle = '#535353';
      ctx.font = '13px monospace';
      ctx.fillText(`HI ${String(hi).padStart(5, '0')}  ${String(s.score).padStart(5, '0')}`, w - 180, 24);

      if (!started) {
        ctx.font = '14px system-ui';
        ctx.fillText('Press Space to start', w / 2 - 70, 100);
      }
      if (gameOver) {
        ctx.font = '14px system-ui';
        ctx.fillText('Game over — press Space', w / 2 - 85, 100);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver, hi]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
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
        <canvas ref={canvasRef} width={640} height={240} className={styles.canvas} onClick={jump} />
      </div>
    </div>
  );
}
