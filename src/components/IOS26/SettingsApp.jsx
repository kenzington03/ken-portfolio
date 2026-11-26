import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EMAIL } from '../Brief/briefData.js';
import { INSTAGRAM, LINKEDIN } from '../../data/links.js';
import { Glyph } from './icons.jsx';
import Nav from './Nav.jsx';
import { usePhone } from './PhoneContext.js';
import { WALLPAPERS } from './wallpapers.js';
import styles from './settings.module.css';

/* Settings, laid out like iOS: search, the account card, grouped lists with
   coloured icon tiles and chevrons, and pages that slide in from the right.
   Everything that can be real is real (connectivity, appearance, brightness,
   wallpaper, full screen); the rest answers with a toast, like a demo should. */

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
const MORE = {
  bell: <path {...s} d="M6 16V11a6 6 0 0 1 12 0v5l1.6 2H4.4zM10 20.5a2.2 2.2 0 0 0 4 0" />,
  gear: (
    <g {...s}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" />
    </g>
  ),
  sliders: <path {...s} d="M4 8h9M17 8h3M4 16h3M11 16h9M15 5.5v5M9 13.5v5" />,
  hourglass: <path {...s} d="M7 3.5h10M7 20.5h10M8 3.5c0 5 8 5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5-8 8.5" />,
  lock: <path {...s} d="M6.5 11h11v8.5h-11zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  grid: <path {...s} d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
  person: <path {...s} d="M12 12.2a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6zM4.8 20c.6-3.6 3.6-5.4 7.2-5.4s6.6 1.8 7.2 5.4" />,
  flower: <path {...s} d="M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 10c-2.6-3-1-6 0-6s2.6 3 0 6zM14 12c3-2.6 6-1 6 0s-3 2.6-6 0zM12 14c2.6 3 1 6 0 6s-2.6-3 0-6zM10 12c-3 2.6-6 1-6 0s3-2.6 6 0z" />,
  info: <path {...s} d="M12 11v6M12 7.5v.2M3.5 12a8.5 8.5 0 1 0 17 0 8.5 8.5 0 0 0-17 0z" />,
  hand: <path {...s} d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10V4.8a1.5 1.5 0 0 1 3 0V11M14 10V6.5a1.5 1.5 0 0 1 3 0V13c0 4-2 7-5.5 7S7 18 6 15.5L4.6 12.5a1.4 1.4 0 0 1 2.4-1.4L8 12.5" />,
  universal: <path {...s} d="M12 8.2v.1M7 10.5l5 1 5-1M12 11.5v3.5M9.5 20l2.5-5 2.5 5M3.5 12a8.5 8.5 0 1 0 17 0 8.5 8.5 0 0 0-17 0z" />,
  chevron: <path d="M9 5l7 7-7 7" {...s} strokeWidth="2.4" />,
};
function Ic({ name, size = 18 }) {
  if (MORE[name]) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }} aria-hidden>
        {MORE[name]}
      </svg>
    );
  }
  return <Glyph name={name} size={size} />;
}
const Chev = () => (
  <span className={styles.chev}>
    <Ic name="chevron" size={14} />
  </span>
);

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`${styles.switch} ${on ? styles.switchOn : ''}`} onClick={(e) => { e.stopPropagation(); onChange(!on); }}>
      <i />
    </button>
  );
}

export default function SettingsApp() {
  const { theme, setTheme, showTutorial, wallpaper, setWallpaper, brightness, setBrightness, net, setNet, fullscreen, isFullscreen, exit, toast } = usePhone();
  const [stack, setStack] = useState([]);
  const [q, setQ] = useState('');
  const [flags, setFlags] = useState({ notif: true, preview: true, silent: false, haptic: true, dnd: false, work: false, sleep: false, larger: false, bold: false, motion: false, badges: true });
  const bar = useRef(null);

  const push = (id) => setStack((a) => [...a, id]);
  const pop = () => setStack((a) => a.slice(0, -1));
  const isOn = (k) => (k in net ? net[k] : flags[k]);
  const flip = (k, v) => (k in net ? setNet({ ...net, [k]: v }) : setFlags((f) => ({ ...f, [k]: v })));
  const demo = (msg) => () => toast(msg);
  const send = async () => {
    const url = `${window.location.origin}/`;
    try {
      if (navigator.share) await navigator.share({ title: 'Kenneth Nathanael, Designer', url });
      else window.location.href = `mailto:?subject=${encodeURIComponent("Ken's portfolio")}&body=${encodeURIComponent(url)}`;
    } catch {
      /* closed the share sheet */
    }
  };
  const open = (href) => () => window.open(href, '_blank', 'noopener');
  const wallLabel = WALLPAPERS.find((w) => w.id === wallpaper)?.label ?? 'iOS 26';

  /* row: { icon, bg, label, value, to, act, toggle, check, danger } */
  const ROOT = [
    [
      { icon: 'airplane', bg: 'var(--ios-orange)', label: 'Airplane Mode', toggle: 'air' },
      { icon: 'wifi', bg: 'var(--ios-blue)', label: 'Wi-Fi', value: net.air || !net.wifi ? 'Off' : 'Home', to: 'wifi' },
      { icon: 'bluetooth', bg: 'var(--ios-blue)', label: 'Bluetooth', value: net.bt ? 'On' : 'Off', to: 'bt' },
      { icon: 'cellular', bg: 'var(--ios-green)', label: 'Cellular', value: net.air || !net.cell ? 'Off' : '', to: 'cell' },
    ],
    [
      { icon: 'bell', bg: 'var(--ios-red)', label: 'Notifications', to: 'notif' },
      { icon: 'speaker', bg: 'var(--ios-pink)', label: 'Sounds & Haptics', to: 'sounds' },
      { icon: 'moon', bg: 'var(--ios-indigo)', label: 'Focus', to: 'focus' },
      { icon: 'hourglass', bg: 'var(--ios-indigo)', label: 'Screen Time', to: 'time' },
    ],
    [
      { icon: 'gear', bg: 'var(--ios-gray)', label: 'General', to: 'general' },
      { icon: 'sliders', bg: 'var(--ios-gray)', label: 'Control Center', to: 'cc' },
      { icon: 'sun', bg: 'var(--ios-blue)', label: 'Display & Brightness', to: 'display' },
      { icon: 'grid', bg: 'var(--ios-indigo)', label: 'Home Screen & App Library', to: 'home' },
      { icon: 'universal', bg: 'var(--ios-blue)', label: 'Accessibility', to: 'access' },
      { icon: 'flower', bg: 'var(--ios-cyan)', label: 'Wallpaper', value: wallLabel, to: 'wall' },
    ],
    [
      { icon: 'lock', bg: 'var(--ios-blue)', label: 'Privacy & Security', to: 'privacy' },
      { icon: 'info', bg: 'var(--ios-gray)', label: 'About this iPhone', to: 'about' },
    ],
  ];

  const T = (label, k, extra = {}) => ({ label, toggle: k, ...extra });
  const PAGES = {
    wifi: { title: 'Wi-Fi', sections: [
      { rows: [T('Wi-Fi', 'wifi')] },
      { head: 'My Networks', rows: [{ label: 'Home', check: net.wifi && !net.air, act: () => setNet({ ...net, wifi: true, air: false }) }] },
      { head: 'Other Networks', rows: ['Studio', 'Café', 'Neighbour 5G'].map((n) => ({ label: n, act: demo(`“${n}” needs a password`) })) },
    ] },
    bt: { title: 'Bluetooth', sections: [
      { rows: [T('Bluetooth', 'bt')], foot: 'This iPhone is discoverable as “Kenneth’s iPhone” while Bluetooth is on.' },
      { head: 'My Devices', rows: [{ label: 'AirPods Pro', value: 'Not Connected', act: demo('AirPods Pro are not nearby') }] },
    ] },
    cell: { title: 'Cellular', sections: [
      { rows: [T('Cellular Data', 'cell')] },
      { rows: [{ label: 'Cellular Data Options', value: 'Roaming Off', act: demo('Roaming is off') }, { label: 'Personal Hotspot', value: 'Off', act: demo('Personal Hotspot is off') }] },
      { head: 'Cellular Plans', rows: [{ label: 'Primary', value: 'Unlimited', act: demo('Unlimited, as it should be') }] },
    ] },
    notif: { title: 'Notifications', sections: [
      { rows: [T('Allow Notifications', 'notif'), T('Show Previews', 'preview')] },
      { head: 'Notification Style', rows: [{ label: 'Messages', value: 'Banners', act: demo('Banners') }, { label: 'Mail', value: 'Banners', act: demo('Banners') }, { label: 'Get a Design', value: 'Immediate', act: demo('Ken replies fast') }] },
    ] },
    sounds: { title: 'Sounds & Haptics', sections: [
      { rows: [T('Silent Mode', 'silent'), T('Vibrate on Ring', 'haptic')] },
      { head: 'Sounds and Vibration Patterns', rows: [{ label: 'Ringtone', value: 'Reflection', act: demo('Reflection') }, { label: 'Text Tone', value: 'Note', act: demo('Note') }] },
    ] },
    focus: { title: 'Focus', sections: [
      { rows: [T('Do Not Disturb', 'dnd', { icon: 'moon', bg: 'var(--ios-indigo)' }), T('Work', 'work', { icon: 'grid', bg: 'var(--ios-blue)' }), T('Sleep', 'sleep', { icon: 'bell', bg: 'var(--ios-teal)' })], foot: 'Focus lets you silence notifications that are not relevant to what you are doing.' },
    ] },
    time: { title: 'Screen Time', sections: [
      { head: 'This week', rows: [{ label: 'Daily Average', value: '3h 12m', flat: true }, { label: 'Most used', value: 'Safari', flat: true }, { label: 'Pickups', value: '58', flat: true }] },
    ] },
    general: { title: 'General', sections: [
      { rows: [{ label: 'About', to: 'about' }, { label: 'Software Update', value: 'iOS 26', act: demo('iOS 26 is up to date') }] },
      { rows: [{ label: 'Full screen', value: isFullscreen ? 'On' : '', to: null, act: fullscreen, chev: true }, { label: 'How to use this phone', act: showTutorial, chev: true }, { label: 'Send the link to my laptop', act: send, chev: true }] },
      { rows: [{ label: 'iPhone Storage', value: '112 GB of 256 GB', act: demo('112 GB used') }] },
    ] },
    cc: { title: 'Control Center', sections: [
      { head: 'Included Controls', rows: [{ label: 'Wi-Fi', value: net.wifi ? 'On' : 'Off', flat: true }, { label: 'Appearance', value: theme === 'dark' ? 'Dark' : 'Light', flat: true }, { label: 'Camera', flat: true }, { label: 'Spotify', flat: true }], foot: 'Swipe down from the top right of the screen to open Control Center.' },
      exit ? { rows: [{ label: 'Back to the story', act: exit, chev: true }] } : null,
    ] },
    home: { title: 'Home Screen & App Library', sections: [
      { head: 'Newly Downloaded Apps', rows: [{ label: 'Add to Home Screen', check: true, act: demo('Add to Home Screen') }, { label: 'App Library Only', act: demo('App Library Only') }] },
      { head: 'Home Screen', rows: [T('Show Badges', 'badges')] },
    ] },
    access: { title: 'Accessibility', sections: [
      { head: 'Vision', rows: [T('Larger Text', 'larger'), T('Bold Text', 'bold'), T('Reduce Motion', 'motion')] },
      { rows: [{ label: 'Display & Text Size', act: demo('Display & Text Size') }, { label: 'VoiceOver', value: 'Off', act: demo('VoiceOver is off') }] },
    ] },
    privacy: { title: 'Privacy & Security', sections: [
      { rows: [{ label: 'Camera', value: 'Ask', act: demo('Ken’s site only asks when you open Camera') }, { label: 'Photos', value: 'This visit only', act: demo('Photos live in memory and vanish on reload') }, { label: 'Location Services', value: 'Off', act: demo('Never used') }] },
      { head: 'Data', rows: [{ label: 'Tracking', value: 'None', act: demo('No trackers on this phone') }], foot: 'Pictures you take here are kept in memory for this visit only. Nothing is uploaded or saved.' },
    ] },
    about: { title: 'About', sections: [
      { rows: [{ label: 'Name', value: 'Kenneth’s iPhone', flat: true }, { label: 'iOS Version', value: '26.0', flat: true }, { label: 'Model Name', value: 'iPhone 17 Pro', flat: true }, { label: 'Capacity', value: '256 GB', flat: true }, { label: 'Built with', value: 'React + Vite', flat: true }] },
    ] },
    account: { title: '', custom: 'account' },
    display: { title: 'Display & Brightness', custom: 'display' },
    wall: { title: 'Wallpaper', custom: 'wall' },
  };

  const renderRow = (r, i) => {
    const hasIcon = !!r.icon;
    const cls = `${styles.row} ${hasIcon ? styles.hasIcon : ''} ${r.flat || r.toggle ? styles.flat : ''}`;
    const body = (
      <>
        {hasIcon && (
          <span className={styles.tile} style={{ background: r.bg }}>
            <Ic name={r.icon} size={18} />
          </span>
        )}
        <span className={`${styles.label} ${r.danger ? styles.danger : ''}`}>{r.label}</span>
        {r.value ? <span className={styles.val}>{r.value}</span> : null}
        {r.check && (
          <span className={styles.check}>
            <Glyph name="check" size={18} />
          </span>
        )}
        {r.toggle && <Toggle on={!!isOn(r.toggle)} label={r.label} onChange={(v) => flip(r.toggle, v)} />}
        {(r.to || r.chev) && <Chev />}
      </>
    );
    if (r.flat || r.toggle) {
      return (
        <div key={i} className={cls}>
          {body}
        </div>
      );
    }
    return (
      <button key={i} type="button" className={cls} onClick={r.act ?? (() => push(r.to))}>
        {body}
      </button>
    );
  };
  const renderSections = (sections) =>
    sections.filter(Boolean).map((sec, i) => (
      <div key={i}>
        {sec.head && <div className={styles.head}>{sec.head}</div>}
        <div className={styles.group}>{sec.rows.map(renderRow)}</div>
        {sec.foot && <div className={styles.foot}>{sec.foot}</div>}
      </div>
    ));

  const setB = (e) => {
    const r = bar.current.getBoundingClientRect();
    setBrightness(Math.min(1, Math.max(0.25, (e.clientX - r.left) / r.width)));
  };
  const Look = ({ id, label, cls }) => (
    <button type="button" className={styles.look} onClick={() => setTheme(id)} aria-pressed={theme === id}>
      <span className={`${styles.lookThumb} ${cls}`} />
      {label}
      <span className={`${styles.tick} ${theme === id ? styles.tickOn : ''}`} aria-hidden>
        {theme === id && <Glyph name="check" size={12} />}
      </span>
    </button>
  );

  const custom = {
    account: (
      <>
        <div className={styles.big}>
          <img className={styles.bigAvatar} src="/assets/profile/ken.jpg" alt="" />
          <div className={styles.bigName}>Kenneth Nathanael</div>
          <div className={styles.sub}>Product & brand designer</div>
        </div>
        {renderSections([
          { rows: [{ label: 'Email', value: EMAIL, act: open(`mailto:${EMAIL}`) }, { label: 'Instagram', act: open(INSTAGRAM), chev: true }, { label: 'LinkedIn', act: open(LINKEDIN), chev: true }] },
          { rows: [{ label: 'Send the link to my laptop', act: send, chev: true }, exit ? { label: 'Back to the story', act: exit, chev: true } : null].filter(Boolean) },
        ])}
      </>
    ),
    display: (
      <>
        <div className={styles.head}>Appearance</div>
        <div className={styles.group}>
          <div className={styles.looks}>
            <Look id="light" label="Light" cls={styles.lookLight} />
            <Look id="dark" label="Dark" cls={styles.lookDark} />
          </div>
        </div>
        <div className={styles.head}>Brightness</div>
        <div className={styles.group}>
          <div className={styles.slider}>
            <Glyph name="sun" size={16} />
            <div ref={bar} className={styles.sliderBar} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setB(e); }} onPointerMove={(e) => e.buttons && setB(e)} role="slider" aria-label="Brightness" aria-valuemin={25} aria-valuemax={100} aria-valuenow={Math.round(brightness * 100)}>
              <i style={{ width: `${((brightness - 0.25) / 0.75) * 100}%` }} />
            </div>
            <Glyph name="sun" size={22} />
          </div>
        </div>
        {renderSections([{ rows: [{ label: 'Auto-Lock', value: 'Never', act: demo('Never locks while you browse') }, { label: 'Text Size', act: demo('Text Size'), chev: true }] }])}
      </>
    ),
    wall: (
      <>
        <div className={styles.wallHero}>
          <div className={styles.wallPhone}>
            <img src={WALLPAPERS.find((w) => w.id === wallpaper)?.src} alt="" />
            <div className={styles.wallClock}>9:41</div>
          </div>
        </div>
        <div className={styles.head}>Choose a wallpaper</div>
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
      </>
    ),
  };

  const all = ROOT.flat();
  const hits = q.trim() ? Object.entries(PAGES).filter(([, p]) => p.title.toLowerCase().includes(q.trim().toLowerCase())).map(([id, p]) => ({ label: p.title, to: id })) : [];
  const found = q.trim() ? [...all.filter((r) => r.label.toLowerCase().includes(q.trim().toLowerCase())), ...hits.filter((h) => !all.some((r) => r.to === h.to))] : [];

  return (
    <div className={styles.root}>
      <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }} animate={{ x: stack.length ? -90 : 0, opacity: stack.length ? 0.6 : 1 }} transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}>
        <Nav label="Home" />
        <div className={styles.scroll}>
          <div className={styles.title}>Settings</div>
          <label className={styles.search}>
            <Glyph name="search" size={16} />
            <input type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search settings" />
          </label>
          {q.trim() ? (
            found.length ? (
              <div className={styles.group}>{found.map(renderRow)}</div>
            ) : (
              <div className={styles.none}>No Results</div>
            )
          ) : (
            <>
              <button type="button" className={styles.profile} onClick={() => push('account')}>
                <img className={styles.avatar} src="/assets/profile/ken.jpg" alt="" />
                <span style={{ flex: 1 }}>
                  <div className={styles.name}>Kenneth Nathanael</div>
                  <div className={styles.sub}>Portfolio, Contact &amp; More</div>
                </span>
                <Chev />
              </button>
              {ROOT.map((rows, i) => (
                <div key={i} className={styles.group}>
                  {rows.map(renderRow)}
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {stack.map((id, depth) => {
          const p = PAGES[id];
          if (!p) return null;
          const prev = depth === 0 ? 'Settings' : PAGES[stack[depth - 1]]?.title || 'Back';
          const top = depth === stack.length - 1;
          return (
            <motion.div
              key={`${depth}-${id}`}
              className={styles.page}
              initial={{ x: '100%' }}
              animate={{ x: top ? 0 : -90, opacity: top ? 1 : 0.6 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className={styles.bar}>
                <button type="button" className={styles.backBtn} onClick={pop}>
                  <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
                    <path d="M10 2L2 10l8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {prev}
                </button>
                <div className={styles.barTitle}>{p.title}</div>
                <span />
              </div>
              <div className={styles.scroll}>{p.custom ? custom[p.custom] : renderSections(p.sections)}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
