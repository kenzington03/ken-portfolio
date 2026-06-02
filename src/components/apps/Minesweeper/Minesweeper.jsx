import { useCallback, useState } from 'react';
import { useOS } from '../../../context/OSContext.jsx';
import styles from './Minesweeper.module.css';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

function createBoard() {
  const board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );

  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
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

export default function Minesweeper() {
  const { unlock } = useOS();
  const [board, setBoard] = useState(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flags, setFlags] = useState(0);

  const checkWin = useCallback((b) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = b[r][c];
        if (!cell.mine && !cell.revealed) return false;
      }
    }
    return true;
  }, []);

  const reveal = useCallback(
    (r, c, b) => {
      const next = cloneBoard(b);
      const stack = [[r, c]];

      while (stack.length) {
        const [cr, cc] = stack.pop();
        const cell = next[cr][cc];
        if (cell.revealed || cell.flagged) continue;
        cell.revealed = true;
        if (cell.mine) {
          setGameOver(true);
          return next;
        }
        if (cell.adjacent === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !next[nr][nc].revealed) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }

      if (checkWin(next)) {
        setWon(true);
        unlock('minesweeper_win');
      }
      return next;
    },
    [checkWin, unlock]
  );

  const onCellClick = (r, c) => {
    if (gameOver || won || board[r][c].revealed || board[r][c].flagged) return;
    setBoard(reveal(r, c, board));
  };

  const onRightClick = (e, r, c) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].revealed) return;
    const next = cloneBoard(board);
    next[r][c].flagged = !next[r][c].flagged;
    setFlags((f) => f + (next[r][c].flagged ? 1 : -1));
    setBoard(next);
  };

  const restart = () => {
    setBoard(createBoard());
    setGameOver(false);
    setWon(false);
    setFlags(0);
  };

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <span>🚩 {MINES - flags}</span>
        <span>{won ? '😎' : gameOver ? '😵' : '🙂'}</span>
      </div>
      <div className={styles.board} style={{ gridTemplateColumns: `repeat(${COLS}, 24px)` }}>
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
                onClick={() => onCellClick(r, c)}
                onContextMenu={(e) => onRightClick(e, r, c)}
                disabled={gameOver}
              >
                {content}
              </button>
            );
          })
        )}
      </div>
      {won && <p className={styles.win}>You cleared the field!</p>}
      {gameOver && <p className={styles.lose}>Boom. Try again.</p>}
      <button type="button" className={styles.restart} onClick={restart}>
        New game
      </button>
    </div>
  );
}
