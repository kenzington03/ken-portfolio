import { useCallback, useRef, useState } from 'react';

/** Lofi fallback when track URLs are unavailable (stand-in stream). */
export const LOFI_FALLBACK_SRC =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3';

/** Hide player until real per-track audio URLs are wired in. */
export const MUSIC_PLAYER_ENABLED = false;

export const MUSIC_TRACKS = [
  {
    id: 'thinkin-bout-you',
    title: 'Thinkin Bout You',
    artist: 'Frank Ocean',
    art: '/assets/icons/dock-claude-logo.png',
    src: LOFI_FALLBACK_SRC,
  },
  {
    id: 'best-part',
    title: 'Best Part',
    artist: 'Daniel Caesar',
    art: '/assets/icons/dock-photos.png',
    src: LOFI_FALLBACK_SRC,
  },
  {
    id: 'navajo',
    title: 'Navajo',
    artist: 'Masego',
    art: '/assets/icons/dock-notes.png',
    src: LOFI_FALLBACK_SRC,
  },
  {
    id: 'good-days',
    title: 'Good Days',
    artist: 'SZA',
    art: '/assets/icons/dock-mail.png',
    src: LOFI_FALLBACK_SRC,
  },
];

export function useMusicPlayer() {
  const audioRef = useRef(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const track = MUSIC_TRACKS[trackIndex];

  const syncProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    setProgress(audio.currentTime / audio.duration);
    setDuration(audio.duration);
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, play, pause]);

  const pickNextIndex = useCallback(
    (dir = 1) => {
      if (shuffle) {
        let next = trackIndex;
        while (next === trackIndex) {
          next = Math.floor(Math.random() * MUSIC_TRACKS.length);
        }
        return next;
      }
      return (trackIndex + dir + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    },
    [shuffle, trackIndex]
  );

  const next = useCallback(() => {
    setTrackIndex(() => pickNextIndex(1));
    setProgress(0);
  }, [pickNextIndex]);

  const prev = useCallback(() => {
    setTrackIndex(() => pickNextIndex(-1));
    setProgress(0);
  }, [pickNextIndex]);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  return {
    audioRef,
    track,
    trackIndex,
    playing,
    shuffle,
    progress,
    duration,
    play,
    pause,
    togglePlay,
    next,
    prev,
    toggleShuffle,
    syncProgress,
    setPlaying,
  };
}
