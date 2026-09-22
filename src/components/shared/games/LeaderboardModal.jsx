import { useEffect, useState } from 'react';
import { getTopScores, isBackendConnected } from '../../../utils/leaderboard.js';
import styles from './LeaderboardModal.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardModal({
  gameKey,
  gameLabel,
  lowerIsBetter = false,
  formatScore = (s) => String(s),
  onClose,
}) {
  const [status, setStatus] = useState('loading');
  const [scores, setScores] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getTopScores(gameKey, { limit: 10, lowerIsBetter })
      .then((data) => {
        if (cancelled) return;
        setScores(data);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [gameKey, lowerIsBetter]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{gameLabel} — Leaderboard</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {!isBackendConnected() && (
          <p className={styles.note}>Showing scores saved on this device.</p>
        )}

        {status === 'loading' && <p className={styles.state}>Loading…</p>}
        {status === 'error' && <p className={styles.state}>Couldn't load scores. Try again shortly.</p>}
        {status === 'ready' && scores.length === 0 && (
          <p className={styles.state}>No scores yet — be the first!</p>
        )}

        {status === 'ready' && scores.length > 0 && (
          <ol className={styles.list}>
            {scores.map((s, i) => (
              <li key={`${s.name}-${s.created_at ?? i}-${i}`} className={styles.row}>
                <span className={styles.rank}>{MEDALS[i] ?? `#${i + 1}`}</span>
                <span className={styles.name}>{s.name}</span>
                <span className={styles.score}>{formatScore(s.score)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
