import { useEffect, useRef, useState } from 'react';
import {
  getLocalBest,
  getSavedPlayerName,
  isBackendConnected,
  recordLocalScore,
  submitScore,
} from '../../../utils/leaderboard.js';
import LeaderboardModal from './LeaderboardModal.jsx';
import styles from './GameOverScreen.module.css';

/**
 * Shared end-of-game overlay: final score, personal best, name entry +
 * submit to the leaderboard, Play Again, and View Leaderboard. Every
 * game (Flappy Bird, Chrome Dino, Minesweeper, and the new ones) renders
 * this the same way — it owns the whole "you died / you won" screen so
 * individual games don't reimplement score UI.
 */
export default function GameOverScreen({
  open,
  won = false,
  gameKey,
  gameLabel,
  score,
  formatScore = (s) => String(s),
  lowerIsBetter = false,
  level,
  extraStat,
  allowSubmit = true,
  onPlayAgain,
}) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // The effect below writes the new best to storage, so it must only
  // evaluate once per game-over (StrictMode runs effects twice in dev).
  const evaluatedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      evaluatedRef.current = false;
      return;
    }
    if (evaluatedRef.current) return;
    evaluatedRef.current = true;
    setName(getSavedPlayerName());
    setSubmitted(false);
    setSubmitting(false);
    setShowLeaderboard(false);
    const prevBest = getLocalBest(gameKey, { lowerIsBetter });
    // A loss (allowSubmit=false) or a zero score isn't a real result, so it
    // can't be a "new best" even when there's no previous best to beat.
    const isRealResult = allowSubmit && (lowerIsBetter || score > 0);
    const better =
      isRealResult &&
      (prevBest === null || (lowerIsBetter ? score < prevBest : score > prevBest));
    setIsNewBest(better);
    // Persist the personal best now: games show it as their "HI" readout and
    // it must survive a reload even if the player never submits a name.
    if (better) recordLocalScore(gameKey, score, { lowerIsBetter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameKey]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || submitted) return;
    setSubmitting(true);
    await submitScore(gameKey, { name, score, lowerIsBetter });
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.kicker}>{won ? 'Nice run' : 'Game Over'}</p>
        <h2 className={styles.title}>{gameLabel}</h2>

        {isNewBest && <span className={styles.bestBadge}>New Best!</span>}

        <div className={styles.scoreRow}>
          <span className={styles.scoreValue}>{formatScore(score)}</span>
          {level != null && <span className={styles.levelTag}>Level {level}</span>}
        </div>

        {extraStat && (
          <p className={styles.extraStat}>
            {extraStat.label}: {extraStat.value}
          </p>
        )}

        {allowSubmit && !submitted && (
          <form className={styles.nameForm} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="Your name"
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Score'}
            </button>
          </form>
        )}
        {allowSubmit && submitted && (
          <p className={styles.savedNote}>Score saved{isBackendConnected() ? '' : ' on this device'}.</p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onPlayAgain}>
            Play Again
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setShowLeaderboard(true)}
          >
            View Leaderboard
          </button>
        </div>

        {!isBackendConnected() && (
          <p className={styles.localNote}>Leaderboard is local to this device for now.</p>
        )}
      </div>

      {showLeaderboard && (
        <LeaderboardModal
          gameKey={gameKey}
          gameLabel={gameLabel}
          lowerIsBetter={lowerIsBetter}
          formatScore={formatScore}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
