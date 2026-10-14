import { useCallback, useEffect, useRef, useState } from 'react';
import { useOS } from '../../../context/OSContext.jsx';
import GameOverScreen from '../../shared/games/GameOverScreen.jsx';
import styles from './Minesweeper.module.css';

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', rows: 9, cols: 9, mines: 10, cell: 24 },
  { id: 'intermediate', label: 'Intermediate', rows: 16, cols: 16, mines: 40, cell: 22 },
  { id: 'expert', label: 'Expert', rows: 16, cols: 30, mines: 99, cell: 20 },
];
// On a phone the boards stand upright (Expert is 16 wide, 30 tall) and the
// cells grow to fill the width.
const MOBILE_DIFFICULTIES = DIFFICULTIES.map((d) => (d.cols > d.rows ? { ...d, rows: d.cols, cols: d.rows } : d));
const LONG_PRESS_MS = 380;
const mobileCell = (cols) => Math.floor(Math.min(40, (window.innerWidth - 24 - (cols - 1) * 2) / cols));

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function createBoard(rows, cols, mines) {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export default function Minesweeper({ mobile = false }) {
  const { unlock } = useOS();
  // Phone: tap reveals, long-press (or Flag mode) plants a flag.
  const [flagMode, setFlagMode] = useState(false);
  const pressRef = useRef({ timer: 0, fired: false });
  const [difficulty, setDifficulty] = useState(null);
  const [board, setBoard] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flags, setFlags] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startedRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const startGame = (diff) => {
    setDifficulty(diff);
    setBoard(createBoard(diff.rows, diff.cols, diff.mines));
    setGameOver(false);
    setWon(false);
    setFlags(0);
    setRevealedCount(0);
    setElapsed(0);
    startedRef.current = false;
    stopTimer();
  };

  const restart = () => {
    if (!difficulty) return;
    startGame(difficulty);
  };

  const changeDifficulty = () => {
    stopTimer();
    setDifficulty(null);
    setBoard(null);
  };

  const checkWin = useCallback(
    (b) => {
      for (let r = 0; r < difficulty.rows; r++) {
        for (let c = 0; c < difficulty.cols; c++) {
          const cell = b[r][c];
          if (!cell.mine && !cell.revealed) return false;
        }
      }
      return true;
    },
    [difficulty]
  );

  const reveal = useCallback(
    (r, c, b) => {
      const next = cloneBoard(b);
      const stack = [[r, c]];
      let newlyRevealed = 0;

      while (stack.length) {
        const [cr, cc] = stack.pop();
        const cell = next[cr][cc];
        if (cell.revealed || cell.flagged) continue;
        cell.revealed = true;
        newlyRevealed += 1;
        if (cell.mine) {
          stopTimer();
          setGameOver(true);
          // the mine itself isn't a cleared cell
          setRevealedCount((n) => n + newlyRevealed - 1);
          return next;
        }
        if (cell.adjacent === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (
                nr >= 0 &&
                nr < difficulty.rows &&
                nc >= 0 &&
                nc < difficulty.cols &&
                !next[nr][nc].revealed
              ) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }

      setRevealedCount((n) => n + newlyRevealed);

      if (checkWin(next)) {
        stopTimer();
        setWon(true);
        unlock('minesweeper_win');
      }
      return next;
    },
    [checkWin, unlock, stopTimer, difficulty]
  );

  const toggleFlag = (r, c) => {
    if (gameOver || won || board[r][c].revealed) return;
    const next = cloneBoard(board);
    next[r][c].flagged = !next[r][c].flagged;
    setFlags((f) => f + (next[r][c].flagged ? 1 : -1));
    setBoard(next);
    navigator.vibrate?.(12);
  };

  const onCellClick = (r, c) => {
    if (mobile && pressRef.current.fired) {
      pressRef.current.fired = false;
      return;
    }
    if (mobile && flagMode) {
      toggleFlag(r, c);
      return;
    }
    if (gameOver || won || board[r][c].revealed || board[r][c].flagged) return;
    if (!startedRef.current) {
      startedRef.current = true;
      startTimer();
    }
    setBoard(reveal(r, c, board));
  };

  const onRightClick = (e, r, c) => {
    e.preventDefault();
    toggleFlag(r, c);
  };

  const pressStart = (r, c) => {
    clearTimeout(pressRef.current.timer);
    pressRef.current.fired = false;
    pressRef.current.timer = setTimeout(() => {
      pressRef.current.fired = true;
      toggleFlag(r, c);
    }, LONG_PRESS_MS);
  };
  const pressEnd = () => clearTimeout(pressRef.current.timer);

  /* ─── Difficulty picker ─── */
  if (!difficulty) {
    return (
      <div className={`${styles.game} ${mobile ? styles.mobile : ''}`}>
        <div className={styles.pickerWrap}>
          {mobile && <p className={styles.mobileTitle}>Minesweeper</p>}
          <p className={styles.pickerTitle}>Choose a difficulty</p>
          <div className={styles.pickerList}>
            {(mobile ? MOBILE_DIFFICULTIES : DIFFICULTIES).map((d) => (
              <button
                key={d.id}
                type="button"
                className={styles.pickerBtn}
                onClick={() => startGame(d)}
              >
                <span className={styles.pickerLabel}>{d.label}</span>
                <span className={styles.pickerMeta}>
                  {d.cols}×{d.rows} · {d.mines} mines
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const gameKey = `minesweeper-${difficulty.id}`;
  const cellSize = mobile ? mobileCell(difficulty.cols) : difficulty.cell;

  return (
    <div className={`${styles.game} ${mobile ? styles.mobile : ''}`}>
      <div className={styles.header} style={{ maxWidth: difficulty.cols * cellSize + (mobile ? (difficulty.cols - 1) * 2 : 0) }}>
        <span>🚩 {difficulty.mines - flags}</span>
        <button type="button" className={styles.difficultyTag} onClick={changeDifficulty}>
          {difficulty.label}
        </button>
        <span>⏱ {formatTime(elapsed)}</span>
      </div>
      <div className={styles.boardWrap}>
        <div
          className={styles.board}
          style={{ gridTemplateColumns: `repeat(${difficulty.cols}, ${cellSize}px)` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              let content = '';
              let className = styles.cell;
              if (cell.flagged && !cell.revealed) {
                content = '🚩';
                className += ` ${styles.flagged}`;
              } else if (cell.revealed) {
                className += ` ${styles.revealed}`;
                if (cell.mine) {
                  content = '💣';
                  className += ` ${styles.mine}`;
                } else if (cell.adjacent > 0) {
                  content = String(cell.adjacent);
                  className += ` ${styles[`n${cell.adjacent}`] ?? ''}`;
                }
              }
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={className}
                  style={{ width: cellSize, height: cellSize, fontSize: mobile ? Math.round(cellSize * 0.5) : undefined }}
                  onClick={() => onCellClick(r, c)}
                  onContextMenu={(e) => onRightClick(e, r, c)}
                  onTouchStart={mobile ? () => pressStart(r, c) : undefined}
                  onTouchEnd={mobile ? pressEnd : undefined}
                  onTouchMove={mobile ? pressEnd : undefined}
                  disabled={gameOver || won}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>

        <GameOverScreen
          open={won || gameOver}
          won={won}
          gameKey={gameKey}
          gameLabel={`Minesweeper, ${difficulty.label}`}
          score={elapsed}
          formatScore={formatTime}
          lowerIsBetter
          allowSubmit={won}
          extraStat={
            won
              ? { label: 'Mines', value: difficulty.mines }
              : { label: 'Cells cleared', value: revealedCount }
          }
          onPlayAgain={restart}
        />
      </div>

      {mobile ? (
        <div className={styles.mobileBar}>
          <div className={styles.segmented} role="radiogroup" aria-label="Tap to">
            <button type="button" role="radio" aria-checked={!flagMode} className={!flagMode ? styles.segOn : ''} onClick={() => setFlagMode(false)}>
              Reveal
            </button>
            <button type="button" role="radio" aria-checked={flagMode} className={flagMode ? styles.segOn : ''} onClick={() => setFlagMode(true)}>
              Flag
            </button>
          </div>
          <button type="button" className={styles.mobileRestart} onClick={restart}>
            New Game
          </button>
        </div>
      ) : (
        <button type="button" className={styles.restart} onClick={restart}>
          New game
        </button>
      )}
    </div>
  );
}
