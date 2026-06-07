import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FlappyBird.module.css';

const BG = '#092C53';
const BIRD = '#F9A619';
const PIPE = '#00172F';
const GRAVITY = 0.45;
const FLAP = -7.5;
const PIPE_GAP = 130;
const PIPE_WIDTH = 52;

export default function FlappyBird() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const stateRef = useRef({
    birdY: 200,
    birdV: 0,
    pipes: [],
    frame: 0,
    score: 0,
  });

  const reset = useCallback(() => {
    stateRef.current = {
      birdY: 200,
      birdV: 0,
      pipes: [{ x: 320, gapY: 120 + Math.random() * 120 }],
      frame: 0,
      score: 0,
    };
    setScore(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  const flap = useCallback(() => {
    if (gameOver) {
      reset();
      return;
    }
    setStarted(true);
    stateRef.current.birdV = FLAP;
  }, [gameOver, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;

    const loop = () => {
      const s = stateRef.current;
      const h = canvas.height;
      const w = canvas.width;

      if (started && !gameOver) {
        s.birdV += GRAVITY;
        s.birdY += s.birdV;
        s.frame += 1;

        if (s.frame % 90 === 0) {
          s.pipes.push({ x: w + 20, gapY: 80 + Math.random() * (h - PIPE_GAP - 160) });
        }

        s.pipes.forEach((p) => {
          p.x -= 2.5;
        });
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_WIDTH);

        const birdX = 70;
        const birdR = 14;

        for (const p of s.pipes) {
          const inPipeX = birdX + birdR > p.x && birdX - birdR < p.x + PIPE_WIDTH;
          const topH = p.gapY;
          const botY = p.gapY + PIPE_GAP;
          if (inPipeX && (s.birdY - birdR < topH || s.birdY + birdR > botY)) {
            setGameOver(true);
          }
          if (!p.scored && p.x + PIPE_WIDTH < birdX) {
            p.scored = true;
            s.score += 1;
            setScore(s.score);
          }
        }

        if (s.birdY + birdR > h || s.birdY - birdR < 0) {
          setGameOver(true);
        }
      }

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      s.pipes.forEach((p) => {
        ctx.fillStyle = PIPE;
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
        ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, h - p.gapY - PIPE_GAP);
      });

      ctx.fillStyle = BIRD;
      ctx.beginPath();
      ctx.arc(70, s.birdY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00172F';
      ctx.beginPath();
      ctx.arc(76, s.birdY - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px system-ui';
      ctx.fillText(String(s.score), w / 2 - 10, 40);

      if (!started) {
        ctx.font = '14px system-ui';
        ctx.fillText('Click or Space to flap', w / 2 - 80, h / 2);
      }
      if (gameOver) {
        ctx.font = '14px system-ui';
        ctx.fillText('Game Over — tap to retry', w / 2 - 90, h / 2 + 24);
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
        width={360}
        height={520}
        className={styles.canvas}
        onClick={flap}
        aria-label="Flappy Bird game"
      />
    </div>
  );
}
