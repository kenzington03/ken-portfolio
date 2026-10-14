// Spotify, laid out as the iOS app: Home (greeting, filter chips, the
// shortcut grid, carousels), Search and Your Library tabs, the mini player
// above the tab bar, and the full-screen Now Playing view. The playlists
// are made up (no real artist's music is attributed to anything here), and
// playback is a simulation: nothing streams.

import { useEffect, useMemo, useState } from 'react';
import styles from './SpotifyApp.module.css';

const COVERS = {
  build: ['#1e3264', '#e8115b'],
  focus: ['#0d73ec', '#8d67ab'],
  kern: ['#ba5d07', '#e1118c'],
  render: ['#148a08', '#1e3264'],
  mood: ['#8c1932', '#e91429'],
  calm: ['#477d95', '#1e3264'],
  monsoon: ['#27856a', '#0d73ec'],
  daily: ['#503750', '#e8115b'],
  ship: ['#af2896', '#509bf5'],
  pixel: ['#e13300', '#ba5d07'],
};

const PLAYLISTS = [
  { id: 'build', title: 'Late-Night Build Sessions', by: 'Ken', tracks: ['Shipping This Portfolio', 'One More Revision', 'Final_final_v7', 'Merge Conflict', 'Deploy at 2 AM'] },
  { id: 'focus', title: 'Deep Focus', by: 'Spotify', tracks: ['Grid Lines', 'Negative Space', 'Quiet Hours', 'Long Render'] },
  { id: 'kern', title: 'Kerning and Coffee', by: 'Ken', tracks: ['Optical Margin', 'Ligature', 'Baseline Shift', 'Widow and Orphan'] },
  { id: 'render', title: 'Render Queue', by: 'Ken', tracks: ['Frame 0001', 'Motion Blur', 'Ease In Out', 'Keyframe'] },
  { id: 'mood', title: 'Moodboard Mix', by: 'Spotify', tracks: ['Swatch', 'Texture Study', 'Reference Wall'] },
  { id: 'calm', title: 'Client Call Calm', by: 'Ken', tracks: ['Sharing My Screen', 'Can You See This', 'Approved'] },
  { id: 'monsoon', title: 'Hyderabad Monsoon', by: 'Ken', tracks: ['Petrichor', 'Irani Chai', 'Old City Lanes'] },
  { id: 'daily', title: 'Daily Mix 1', by: 'Spotify', tracks: ['Made For You', 'On Repeat', 'Discover'] },
  { id: 'ship', title: 'Interfaces That Ship', by: 'Ken', tracks: ['Tap Target', 'Empty State', 'Loading Skeleton'] },
  { id: 'pixel', title: 'The Last Pixel', by: 'Ken', tracks: ['Nudge One Left', 'Pixel Perfect', 'Export at 2x'] },
];

const BROWSE = [
  ['Music', '#dc148c'],
  ['Podcasts', '#006450'],
  ['Made For You', '#8400e7'],
  ['New Releases', '#e8115b'],
  ['Focus', '#503750'],
  ['Chill', '#477d95'],
  ['Workout', '#777777'],
  ['Indie', '#e91429'],
];

const TRACK_SECONDS = 192;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Cover({ id, title, size = 'md' }) {
  const [a, b] = COVERS[id] || COVERS.build;
  return (
    <span className={`${styles.cover} ${styles[`cover_${size}`]}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden>
      <span>{title}</span>
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const Icon = {
  home: <path d="M12 3l9 7.5V21h-6v-6H9v6H3V10.5z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </>
  ),
  library: <path d="M4 3v18M9 3v18M14 4l6 16" />,
  play: <path d="M8 5l11 7-11 7z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
  next: <path d="M6 5l9 7-9 7zM17 5h2v14h-2z" />,
  prev: <path d="M18 5l-9 7 9 7zM5 5h2v14H5z" />,
  heart: <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2 0 3.4 1.2 5.4 3.2 2-2 3.4-3.2 5.4-3.2 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20z" />,
  shuffle: <path d="M3 7h3.5c4 0 6 10 10 10H21M18 14l3 3-3 3M3 17h3.5M14 7h7M18 4l3 3-3 3" />,
  repeat: <path d="M4 12V9a3 3 0 0 1 3-3h13l-3-3M20 12v3a3 3 0 0 1-3 3H4l3 3" />,
  down: <path d="M6 9l6 6 6-6" />,
  devices: <path d="M4 5h16v10H4zM9 19h6" />,
};

function Svg({ name, fill = false, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={fill ? styles.svgFill : styles.svg} aria-hidden>
      {Icon[name]}
    </svg>
  );
}

export default function SpotifyApp() {
  const [tab, setTab] = useState('home');
  const [current, setCurrent] = useState({ list: PLAYLISTS[0], track: 0 });
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(47);
  const [full, setFull] = useState(false);
  const [liked, setLiked] = useState(false);
  const [chip, setChip] = useState('All');

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  // End of a track: on to the next.
  useEffect(() => {
    if (elapsed < TRACK_SECONDS) return;
    setCurrent((c) => ({ ...c, track: (c.track + 1) % c.list.tracks.length }));
    setElapsed(0);
  }, [elapsed]);

  const play = (list, track = 0) => {
    setCurrent({ list, track });
    setElapsed(0);
    setPlaying(true);
  };
  const skip = (d) => {
    setCurrent((c) => ({ ...c, track: (c.track + d + c.list.tracks.length) % c.list.tracks.length }));
    setElapsed(0);
  };

  const trackTitle = current.list.tracks[current.track];
  const shortcuts = PLAYLISTS.slice(0, 6);
  const shelves = useMemo(
    () => [
      { title: 'Made for Ken', items: PLAYLISTS.slice(3, 9) },
      { title: 'Jump back in', items: [...PLAYLISTS].reverse().slice(0, 6) },
    ],
    [],
  );

  return (
    <div className={styles.app}>
      <div className={styles.scroll}>
        {tab === 'home' && (
          <>
            <div className={styles.homeHead}>
              <span className={styles.avatar}>K</span>
              {['All', 'Music', 'Podcasts'].map((c) => (
                <button key={c} type="button" className={`${styles.chip} ${chip === c ? styles.chipOn : ''}`} onClick={() => setChip(c)}>
                  {c}
                </button>
              ))}
            </div>
            <h2 className={styles.greeting}>{greeting()}</h2>
            <div className={styles.shortcuts}>
              {shortcuts.map((p) => (
                <button key={p.id} type="button" className={styles.shortcut} onClick={() => play(p)}>
                  <Cover id={p.id} title={p.title} size="sm" />
                  <span>{p.title}</span>
                  {current.list.id === p.id && playing && <i className={styles.eq} aria-label="Playing" />}
                </button>
              ))}
            </div>
            {shelves.map((shelf) => (
              <section key={shelf.title} className={styles.shelf}>
                <h3>{shelf.title}</h3>
                <div className={styles.carousel}>
                  {shelf.items.map((p) => (
                    <button key={p.id} type="button" className={styles.card} onClick={() => play(p)}>
                      <Cover id={p.id} title={p.title} />
                      <span className={styles.cardTitle}>{p.title}</span>
                      <span className={styles.cardSub}>Playlist · {p.by}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {tab === 'search' && (
          <>
            <h2 className={styles.pageTitle}>Search</h2>
            <div className={styles.searchField}>
              <Svg name="search" size={22} />
              What do you want to listen to?
            </div>
            <h3 className={styles.sectionTitle}>Browse all</h3>
            <div className={styles.browse}>
              {BROWSE.map(([name, color]) => (
                <span key={name} className={styles.browseTile} style={{ background: color }}>
                  {name}
                </span>
              ))}
            </div>
          </>
        )}

        {tab === 'library' && (
          <>
            <div className={styles.libHead}>
              <span className={styles.avatar}>K</span>
              <h2 className={styles.pageTitleInline}>Your Library</h2>
            </div>
            <div className={styles.libList}>
              {PLAYLISTS.map((p) => (
                <button key={p.id} type="button" className={styles.libRow} onClick={() => play(p)}>
                  <Cover id={p.id} title={p.title} size="sm" />
                  <span>
                    <b className={current.list.id === p.id ? styles.green : ''}>{p.title}</b>
                    <small>Playlist · {p.by}</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mini player, floating just above the tab bar. */}
      <div className={styles.mini} onClick={() => setFull(true)} role="button" tabIndex={0} aria-label="Now playing">
        <Cover id={current.list.id} title={current.list.title} size="xs" />
        <span className={styles.miniText}>
          <b>{trackTitle}</b>
          <small>{current.list.title}</small>
        </span>
        <button type="button" aria-label="Devices" onClick={(e) => e.stopPropagation()}>
          <Svg name="devices" size={22} />
        </button>
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={(e) => {
            e.stopPropagation();
            setPlaying((p) => !p);
          }}
        >
          <Svg name={playing ? 'pause' : 'play'} fill size={24} />
        </button>
        <i className={styles.miniProgress} style={{ width: `${(elapsed / TRACK_SECONDS) * 100}%` }} />
      </div>

      <nav className={styles.tabs}>
        {[
          ['home', 'Home'],
          ['search', 'Search'],
          ['library', 'Your Library'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? styles.tabOn : ''} onClick={() => setTab(id)}>
            <Svg name={id} fill={tab === id && id === 'home'} size={24} />
            {label}
          </button>
        ))}
      </nav>

      {/* Now Playing, full screen. */}
      <div className={`${styles.full} ${full ? styles.fullOn : ''}`} style={{ '--tint': (COVERS[current.list.id] || COVERS.build)[0] }} aria-hidden={!full}>
        <div className={styles.fullHead}>
          <button type="button" aria-label="Close" onClick={() => setFull(false)}>
            <Svg name="down" size={26} />
          </button>
          <span>
            <small>PLAYING FROM PLAYLIST</small>
            <b>{current.list.title}</b>
          </span>
          <span style={{ width: 26 }} />
        </div>
        <div className={styles.fullArt}>
          <Cover id={current.list.id} title={current.list.title} size="xl" />
        </div>
        <div className={styles.fullMeta}>
          <span>
            <b>{trackTitle}</b>
            <small>Ken Nathanael</small>
          </span>
          <button type="button" aria-label={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'} className={liked ? styles.green : ''} onClick={() => setLiked((l) => !l)}>
            <Svg name="heart" fill={liked} size={26} />
          </button>
        </div>
        <input
          className={styles.scrub}
          type="range"
          min="0"
          max={TRACK_SECONDS}
          value={elapsed}
          onChange={(e) => setElapsed(Number(e.target.value))}
          aria-label="Seek"
          style={{ '--p': `${(elapsed / TRACK_SECONDS) * 100}%` }}
        />
        <div className={styles.times}>
          <span>{fmt(elapsed)}</span>
          <span>-{fmt(TRACK_SECONDS - elapsed)}</span>
        </div>
        <div className={styles.controls}>
          <button type="button" aria-label="Shuffle" className={styles.green}>
            <Svg name="shuffle" size={24} />
          </button>
          <button type="button" aria-label="Previous" onClick={() => skip(-1)}>
            <Svg name="prev" fill size={34} />
          </button>
          <button type="button" aria-label={playing ? 'Pause' : 'Play'} className={styles.bigPlay} onClick={() => setPlaying((p) => !p)}>
            <Svg name={playing ? 'pause' : 'play'} fill size={30} />
          </button>
          <button type="button" aria-label="Next" onClick={() => skip(1)}>
            <Svg name="next" fill size={34} />
          </button>
          <button type="button" aria-label="Repeat">
            <Svg name="repeat" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
