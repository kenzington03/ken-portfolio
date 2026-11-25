import { useEffect, useMemo, useRef, useState } from 'react';
import { projects, getProjectById, getProjectCoverUrl } from '../../data/projects.js';
import { BEST_WORK } from '../../data/bestWork.js';
import { BOOKING_URL, EMAIL, WHATSAPP } from '../Brief/briefData.js';
import { INSTAGRAM, LINKEDIN } from '../../data/links.js';
import { Glyph } from './icons.jsx';
import AppTile from './AppTile.jsx';
import Nav from './Nav.jsx';
import { usePhone } from './PhoneContext.js';
import { photos, usePhotos } from './photosStore.js';
import { WALLPAPERS } from './wallpapers.js';
import styles from './screens.module.css';

/* The screens that do real things: Camera, Photos, Safari, Settings,
   Reminders, Wallet. Each is drawn as the iOS app, in the kit's colours. */

/* ───────────────────────── Camera ───────────────────────── */

const MODES = [
  ['video', 'VIDEO'],
  ['photo', 'PHOTO'],
  ['portrait', 'PORTRAIT'],
];
const MAX_VIDEO_S = 30;

/* A fake depth-of-field for Portrait: blur the whole frame (cheap: draw it tiny
   and scale it back up: canvas `filter` is missing in Safari), then draw the
   frame sharp inside an ellipse. */
function portraitFrame(video, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const small = document.createElement('canvas');
  small.width = Math.round(w / 14);
  small.height = Math.round(h / 14);
  small.getContext('2d').drawImage(video, 0, 0, small.width, small.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.48, w * 0.36, h * 0.34, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  return c;
}

export function CameraApp() {
  const { close, toast } = usePhone();
  const all = usePhotos();
  const v1 = useRef(null);
  const v2 = useRef(null);
  const stream = useRef(null);
  const rec = useRef(null);
  const timer = useRef(0);
  const [state, setState] = useState('starting'); // starting | on | denied | none
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState('photo');
  const [facing, setFacing] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [recording, setRecording] = useState(0); // seconds, 0 = not recording
  const [popId, setPopId] = useState(null);

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(
    () => () => {
      stop();
      clearInterval(timer.current);
      if (rec.current?.state === 'recording') rec.current.stop();
    },
    [],
  );

  const start = async (face) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('none');
      return;
    }
    stop();
    setReady(false);
    setState('starting');
    try {
      // A modest size starts quickly, and is plenty for a phone-sized preview.
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      stream.current = s;
      setState('on');
      requestAnimationFrame(() => {
        [v1.current, v2.current].forEach((v) => {
          if (!v) return;
          v.srcObject = s;
          v.play?.().catch(() => {});
        });
      });
    } catch {
      setState('denied');
    }
  };
  // It opens already running, like the real app (the permission prompt is the
  // only wait); nothing is recorded or sent anywhere.
  useEffect(() => {
    start(facing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flip = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    start(next);
  };

  const snap = () => {
    const v = v1.current;
    if (!v || !v.videoWidth) return null;
    const w = Math.min(900, v.videoWidth);
    const h = Math.round((w * v.videoHeight) / v.videoWidth);
    let c;
    if (mode === 'portrait') c = portraitFrame(v, w, h);
    else {
      c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(v, 0, 0, w, h);
    }
    return c.toDataURL('image/jpeg', 0.82);
  };

  const shutter = () => {
    if (state !== 'on' || !ready) {
      if (state === 'denied' || state === 'none') toast('Camera is off. Allow it for this site to take photos.');
      else if (state === 'starting') toast('Camera is starting…');
      return;
    }
    if (mode === 'video') {
      if (recording) {
        rec.current?.stop();
        return;
      }
      if (typeof MediaRecorder === 'undefined') {
        toast("Video isn't supported in this browser.");
        return;
      }
      const poster = snap();
      const chunks = [];
      let r;
      try {
        r = new MediaRecorder(stream.current);
      } catch {
        toast("Video isn't supported in this browser.");
        return;
      }
      rec.current = r;
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        clearInterval(timer.current);
        setRecording(0);
        const blob = new Blob(chunks, { type: r.mimeType || 'video/mp4' });
        const item = photos.add({ kind: 'video', url: URL.createObjectURL(blob), poster });
        setPopId(item.id);
        toast('Video saved to Photos (this visit only)');
      };
      r.start();
      let n = 1;
      setRecording(1);
      timer.current = setInterval(() => {
        n += 1;
        setRecording(n);
        if (n >= MAX_VIDEO_S) r.stop();
      }, 1000);
      return;
    }
    const url = snap();
    if (!url) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 140);
    navigator.vibrate?.(10);
    const item = photos.add({ kind: 'photo', url, poster: url });
    setPopId(item.id);
  };

  const last = all[0];
  const thumb = last ? last.poster || last.url : getProjectCoverUrl(projects[0]);
  const mirror = facing === 'user' ? 'scaleX(-1)' : undefined;
  const mmss = `${Math.floor(recording / 60)}:${String(recording % 60).padStart(2, '0')}`;

  return (
    <div className={`${styles.screen} ${styles.camera}`}>
      <div className={styles.viewfinder}>
        <video ref={v1} className={mode === 'portrait' ? styles.blurred : ''} style={{ transform: mirror, opacity: ready ? 1 : 0 }} playsInline muted autoPlay onPlaying={() => setReady(true)} />
        {mode === 'portrait' && <video ref={v2} className={styles.sharp} style={{ transform: mirror, opacity: ready ? 1 : 0 }} playsInline muted autoPlay />}
        {state !== 'on' || !ready ? (
          <div className={styles.camMsg}>
            {state === 'starting' && <span className={styles.spinner} aria-label="Starting camera" />}
            {state === 'denied' && (
              <>
                <span>Camera access is off for this site.</span>
                <button type="button" className={styles.pill} onClick={() => start(facing)}>
                  Allow camera
                </button>
              </>
            )}
            {state === 'none' && <span>This browser can't open a camera.</span>}
          </div>
        ) : null}
        {recording > 0 && (
          <div className={styles.recTime}>
            <i /> {mmss}
          </div>
        )}
        {flash && <div className={styles.flash} />}
        <button type="button" className={styles.pill} onClick={close} style={{ position: 'absolute', top: 10, left: 12, padding: '6px 12px', minHeight: 36 }}>
          ‹ Home
        </button>
      </div>
      <div className={styles.camBar}>
        <div className={styles.modes}>
          {MODES.map(([k, label]) => (
            <button key={k} type="button" className={`${styles.mode} ${mode === k ? styles.modeOn : ''}`} onClick={() => !recording && setMode(k)} aria-pressed={mode === k}>
              {label}
            </button>
          ))}
        </div>
        <div className={styles.shutterRow}>
          <div key={popId} className={`${styles.thumb} ${popId ? styles.thumbPop : ''}`} style={{ backgroundImage: `url("${thumb}")` }} aria-label={`${all.length} taken`} />
          <button type="button" className={`${styles.shutter} ${mode === 'video' ? styles.shutterVideo : ''} ${recording ? styles.shutterRec : ''}`} onClick={shutter} aria-label={mode === 'video' ? (recording ? 'Stop recording' : 'Record') : 'Take photo'} />
          <button type="button" className={styles.flip} onClick={flip} aria-label="Flip camera">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 8.5A8.5 8.5 0 0 0 5 6.2M4 4v3h3M4 15.5a8.5 8.5 0 0 0 15 2.3M20 20v-3h-3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Photos ───────────────────────── */

export function PhotosApp() {
  const { openApp, toast } = usePhone();
  const mine = usePhotos();
  const [view, setView] = useState(null); // an item of mine, open full screen
  const work = useMemo(() => {
    const out = [];
    BEST_WORK.forEach((b) => {
      const p = getProjectById(b.projectId);
      b.pieces.forEach((pc) => out.push({ src: pc.src, alt: pc.alt, slug: p?.slug, name: p?.name }));
    });
    projects.forEach((p) => out.push({ src: getProjectCoverUrl(p), alt: p.name, slug: p.slug, name: p.name }));
    const seen = new Set();
    return out.filter((i) => (seen.has(i.src) ? false : seen.add(i.src)));
  }, []);
  const remove = (id) => {
    photos.remove(id);
    setView(null);
    toast('Deleted');
  };
  return (
    <div className={styles.screen}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle}>Library</div>
        {mine.length > 0 && (
          <>
            <div className={styles.photosHead}>Recents</div>
            <div className={styles.photosGrid}>
              {mine.map((i) => (
                <button key={i.id} type="button" className={styles.photo} onClick={() => setView(i)} aria-label={i.kind === 'video' ? 'Video' : 'Photo'}>
                  <img src={i.poster || i.url} alt="" />
                  {i.kind === 'video' && <span className={styles.vidBadge}>▶</span>}
                </button>
              ))}
            </div>
            <div className={styles.photosNote}>Photos you take here stay in this visit only. Nothing is uploaded or saved.</div>
          </>
        )}
        <div className={styles.photosHead}>Ken's work</div>
        <div className={styles.photosGrid}>
          {work.map((i) => (
            <button key={i.src} type="button" className={styles.photo} onClick={() => i.slug && openApp({ appKey: `project-${i.slug}`, label: i.name })} aria-label={i.alt}>
              <img src={i.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
        <div className={styles.photosFoot}>
          {mine.length + work.length} Photos
          <small>Tap one of Ken's to open its project</small>
        </div>
      </div>
      {view && (
        <div className={styles.viewer} onClick={() => setView(null)}>
          {view.kind === 'video' ? <video src={view.url} controls playsInline autoPlay loop onClick={(e) => e.stopPropagation()} /> : <img src={view.url} alt="Your photo" />}
          <div className={styles.viewerBar} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.pill} onClick={() => setView(null)}>
              Done
            </button>
            <button type="button" className={`${styles.pill} ${styles.danger}`} onClick={() => remove(view.id)} aria-label="Delete">
              <Glyph name="trash" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Safari ───────────────────────── */

const looksLikeUrl = (t) => /^(https?:\/\/)?[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(t.trim());

export function SafariApp() {
  const { openApp, toast } = usePhone();
  const [q, setQ] = useState('');
  const go = (e) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    const url = looksLikeUrl(t) ? (/^https?:\/\//i.test(t) ? t : `https://${t}`) : `https://www.google.com/search?q=${encodeURIComponent(t)}`;
    toast('Opening in a new tab');
    window.open(url, '_blank', 'noopener');
    setQ('');
  };
  const favs = [
    { name: 'Behance', letter: 'Bē', tint: '#0057ff', url: 'https://www.behance.net/' },
    { name: 'Instagram', custom: 'instagram', url: INSTAGRAM },
    { name: 'LinkedIn', custom: 'linkedin', url: LINKEDIN },
    { name: 'Figma', letter: 'F', tint: '#1e1e1e', url: 'https://www.figma.com/' },
    { name: 'Dribbble', letter: 'D', tint: '#ea4c89', url: 'https://dribbble.com/' },
    { name: 'Pinterest', letter: 'P', tint: '#e60023', url: 'https://www.pinterest.com/' },
    { name: 'Awwwards', letter: 'A', tint: '#111', url: 'https://www.awwwards.com/' },
    { name: 'Adobe', letter: 'Ai', tint: '#ff0000', url: 'https://www.adobe.com/' },
  ];
  return (
    <div className={`${styles.screen} ${styles.safari}`}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle}>Start Page</div>
        <div className={styles.sectionHead} style={{ padding: '0 20px 8px' }}>
          Favourites
        </div>
        <div className={styles.favGrid}>
          {favs.map((f) => (
            <a key={f.name} className={styles.fav} href={f.url} target="_blank" rel="noopener noreferrer">
              <div className={styles.favIcon}>
                {f.custom ? (
                  <AppTile app={f} />
                ) : (
                  <span className={styles.favLetter} style={{ background: f.tint }}>
                    {f.letter}
                  </span>
                )}
              </div>
              <span className={styles.favLabel}>{f.name}</span>
            </a>
          ))}
        </div>
        <div className={styles.sectionHead} style={{ padding: '0 20px 8px' }}>
          Ken's pages
        </div>
        <div className={styles.group}>
          {[
            ['Work', 'photos'],
            ['Resume', 'resume'],
            ['Get a Design', 'brief'],
            ['Book a call', null],
          ].map(([name, key]) => (
            <button
              key={name}
              type="button"
              className={styles.row}
              onClick={() => (key ? openApp({ appKey: key, label: name }) : window.open(BOOKING_URL, '_blank', 'noopener'))}
            >
              <span className={`${styles.rowValue} ${styles.rowValueText}`}>{name}</span>
              <span className={styles.rowLabel}>kennethnathanael.com</span>
            </button>
          ))}
        </div>
      </div>
      <form className={styles.addrBar} onSubmit={go}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L21 21" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or enter website" inputMode="url" autoCapitalize="off" autoCorrect="off" enterKeyHint="go" aria-label="Search or enter website name" />
      </form>
    </div>
  );
}

/* ───────────────────────── Settings ───────────────────────── */

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`${styles.switch} ${on ? styles.switchOn : ''}`} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

export function SettingsApp() {
  const { theme, setTheme, showTutorial, wallpaper, setWallpaper, brightness, setBrightness, net, setNet, fullscreen, isFullscreen, exit, toast } = usePhone();
  const bar = useRef(null);
  const setB = (e) => {
    const r = bar.current.getBoundingClientRect();
    setBrightness(Math.min(1, Math.max(0.25, (e.clientX - r.left) / r.width)));
  };
  const send = async () => {
    const url = `${window.location.origin}/`;
    try {
      if (navigator.share) await navigator.share({ title: 'Kenneth Nathanael, Designer', url });
      else window.location.href = `mailto:?subject=${encodeURIComponent("Ken's portfolio")}&body=${encodeURIComponent(url)}`;
    } catch {
      /* closed the share sheet */
    }
  };
  const Tick = ({ on }) => (
    <span className={`${styles.tick} ${on ? styles.tickOn : ''}`} aria-hidden>
      {on && <Glyph name="check" size={12} />}
    </span>
  );
  const Row = ({ children, onClick, value, danger }) => (
    <button type="button" className={styles.settingsRow} onClick={onClick} style={danger ? { color: 'var(--ios-red)' } : undefined}>
      {children}
      {value !== undefined && <span className={styles.settingsVal}>{value}</span>}
    </button>
  );
  return (
    <div className={`${styles.screen} ${styles.grouped}`}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle}>Settings</div>
        <div className={styles.profile}>
          <img className={styles.profileAvatar} src="/assets/profile/ken.jpg" alt="" />
          <div>
            <div className={styles.profileName}>Kenneth Nathanael</div>
            <div className={styles.profileSub}>Portfolio · iOS 26 edition</div>
          </div>
        </div>

        <div className={styles.sectionHead}>Connectivity</div>
        <div className={styles.group}>
          {[
            ['air', 'Airplane Mode'],
            ['wifi', 'Wi-Fi'],
            ['bt', 'Bluetooth'],
            ['cell', 'Cellular'],
          ].map(([k, label]) => (
            <div key={k} className={styles.settingsRow} style={{ cursor: 'default' }}>
              {label}
              <Toggle on={net[k]} label={label} onChange={(v) => setNet({ ...net, [k]: v })} />
            </div>
          ))}
        </div>

        <div className={styles.sectionHead}>Wallpaper</div>
        <div className={styles.wallGrid}>
          {WALLPAPERS.map((w) => (
            <button key={w.id} type="button" className={styles.wall} onClick={() => setWallpaper(w.id)} aria-pressed={wallpaper === w.id} aria-label={w.label}>
              <img src={w.src} alt="" loading="lazy" />
              <span className={styles.wallLabel}>{w.label}</span>
              {wallpaper === w.id && (
                <span className={styles.wallTick}>
                  <Glyph name="check" size={12} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.sectionHead}>Display &amp; Brightness</div>
        <div className={styles.group}>
          <div className={styles.appearance}>
            <button type="button" className={styles.look} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
              <span className={`${styles.lookThumb} ${styles.lookLight}`} />
              Light
              <Tick on={theme === 'light'} />
            </button>
            <button type="button" className={styles.look} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
              <span className={`${styles.lookThumb} ${styles.lookDark}`} />
              Dark
              <Tick on={theme === 'dark'} />
            </button>
          </div>
          <div className={styles.brightRow}>
            <Glyph name="sun" size={16} />
            <div ref={bar} className={styles.brightBar} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setB(e); }} onPointerMove={(e) => e.buttons && setB(e)} role="slider" aria-label="Brightness" aria-valuemin={25} aria-valuemax={100} aria-valuenow={Math.round(brightness * 100)}>
              <i style={{ width: `${((brightness - 0.25) / 0.75) * 100}%` }} />
            </div>
            <Glyph name="sun" size={22} />
          </div>
        </div>

        <div className={styles.sectionHead}>General</div>
        <div className={styles.group}>
          <Row onClick={fullscreen} value={isFullscreen ? 'On' : '›'}>
            Full screen
          </Row>
          <Row onClick={showTutorial} value="›">
            How to use this phone
          </Row>
          <Row onClick={send} value="›">
            Send the link to my laptop
          </Row>
          {exit && (
            <Row onClick={exit} value="›">
              Back to the story
            </Row>
          )}
          <Row onClick={() => toast('Kenneth’s iPhone · iOS 26')} value="iOS 26">
            About
          </Row>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Reminders: what to do next ───────────────────────── */

const TODO = [
  { id: 'look', text: 'Look at the work', go: { appKey: 'photos', label: 'Photos' } },
  { id: 'resume', text: 'Read the resume', go: { appKey: 'resume', label: 'Resume' } },
  { id: 'brief', text: 'Tell Ken what you need designed', go: { appKey: 'brief', label: 'Get a Design' } },
  { id: 'book', text: 'Book a 30 minute call', url: BOOKING_URL },
  { id: 'wa', text: 'Say hi on WhatsApp', url: `https://wa.me/${WHATSAPP}` },
];

export function RemindersApp() {
  const { openApp } = usePhone();
  const [done, setDone] = useState({});
  const left = TODO.filter((t) => !done[t.id]).length;
  return (
    <div className={`${styles.screen} ${styles.reminders}`}>
      <Nav label="Lists" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle} style={{ color: 'var(--ios-orange)' }}>
          Next steps
        </div>
        <div className={styles.remCount}>{left === 0 ? 'All done. Nice.' : `${left} to go`}</div>
        <div className={styles.group} style={{ marginTop: 6 }}>
          {TODO.map((t) => (
            <div key={t.id} className={styles.remRow}>
              <button type="button" className={`${styles.remDot} ${done[t.id] ? styles.remDotOn : ''}`} onClick={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))} aria-label={done[t.id] ? 'Mark as not done' : 'Mark as done'}>
                {done[t.id] && <Glyph name="check" size={13} />}
              </button>
              <button
                type="button"
                className={`${styles.remText} ${done[t.id] ? styles.remDone : ''}`}
                onClick={() => (t.go ? openApp(t.go) : window.open(t.url, '_blank', 'noopener'))}
              >
                {t.text}
                <Glyph name="chevronR" size={14} style={{ color: 'var(--ios-label-3)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Wallet: Ken's card ───────────────────────── */

const vcard = () =>
  `data:text/vcard;charset=utf-8,${encodeURIComponent(`BEGIN:VCARD\nVERSION:3.0\nFN:Kenneth Nathanael\nTITLE:Designer\nTEL;TYPE=CELL:+${WHATSAPP}\nEMAIL:${EMAIL}\nURL:https://kennethnathanael.com\nEND:VCARD`)}`;

export function WalletApp() {
  const { toast } = usePhone();
  return (
    <div className={`${styles.screen} ${styles.grouped}`}>
      <Nav label="Home" />
      <div className={styles.scroll}>
        <div className={styles.largeTitle}>Wallet</div>
        <div className={styles.passWrap}>
          <div className={styles.pass}>
            <div className={styles.passTop}>
              <span>KENNETH NATHANAEL</span>
              <span>DESIGNER</span>
            </div>
            <img className={styles.passPhoto} src="/assets/profile/ken.jpg" alt="" />
            <div className={styles.passName}>Kenneth Nathanael</div>
            <div className={styles.passSub}>Brand · Campaign · Motion · UI/UX</div>
            <div className={styles.passRow}>
              <div>
                <small>EMAIL</small>
                {EMAIL}
              </div>
              <div>
                <small>BASED IN</small>
                Hyderabad
              </div>
            </div>
          </div>
        </div>
        <div className={styles.walletBtns}>
          <a className={styles.primary} href={vcard()} download="Kenneth-Nathanael.vcf" onClick={() => toast('Contact card downloaded')}>
            Add to Contacts
          </a>
          <a className={styles.secondary} href={`mailto:${EMAIL}`}>
            Email Ken
          </a>
        </div>
      </div>
    </div>
  );
}
