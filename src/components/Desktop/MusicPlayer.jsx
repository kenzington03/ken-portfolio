import { useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const {
    audioRef,
    track,
    playing,
    shuffle,
    progress,
    togglePlay,
    next,
    prev,
    toggleShuffle,
    syncProgress,
    setPlaying,
    musicMinimized,
    toggleMusicMinimized,
  } = useOS();

  const wasPlayingRef = useRef(false);

  useEffect(() => {
    wasPlayingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    if (wasPlayingRef.current) {
      audio.muted = false;
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [track.id, audioRef, setPlaying]);

  if (musicMinimized) {
    return (
      <div className={styles.minimizedWrap} aria-label="Music player">
        <audio
          ref={audioRef}
          src={track.src}
          muted
          preload="metadata"
          onTimeUpdate={syncProgress}
          onLoadedMetadata={syncProgress}
          onEnded={next}
        />
        <button
          type="button"
          className={styles.minimizedDot}
          onClick={toggleMusicMinimized}
          aria-label="Expand music player"
        >
          <img
            src={track.art}
            alt=""
            width={40}
            height={40}
            onError={(e) => {
              e.currentTarget.src = '/assets/icons/dock-claude-logo.png';
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card} aria-label="Music player">
      <audio
        ref={audioRef}
        src={track.src}
        muted
        preload="metadata"
        onTimeUpdate={syncProgress}
        onLoadedMetadata={syncProgress}
        onEnded={next}
      />
      <button
        type="button"
        className={styles.closeBtn}
        onClick={toggleMusicMinimized}
        aria-label="Minimize music player"
      >
        ×
      </button>
      <div className={styles.body}>
        <img
          src={track.art}
          alt=""
          className={styles.art}
          width={48}
          height={48}
          onError={(e) => {
            e.currentTarget.src = '/assets/icons/dock-claude-logo.png';
          }}
        />
        <div className={styles.meta}>
          <span className={styles.title}>{track.title}</span>
          <span className={styles.artist}>{track.artist}</span>
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.iconBtn} ${shuffle ? styles.iconBtnActive : ''}`}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            ⇄
          </button>
          <button type="button" className={styles.iconBtn} onClick={prev} aria-label="Previous">
            ⏮
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.playBtn}`}
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button type="button" className={styles.iconBtn} onClick={next} aria-label="Next">
            ⏭
          </button>
        </div>
      </div>
      <div className={styles.progressTrack} aria-hidden>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
