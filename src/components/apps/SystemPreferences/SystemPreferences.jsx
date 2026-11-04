import { useState } from 'react';
import { useOS } from '../../../context/OSContext.jsx';
import { DESKTOP_BACKGROUNDS } from '../../../data/wallpapers.js';
import { setSystem, useSystemSettings } from '../../../hooks/useSystemSettings.js';
import { wallpaperFor } from '../../MenuBar/ControlCenter.jsx';
import styles from './SystemPreferences.module.css';

// System Settings, as on macOS: a sidebar of sections (with Ken's account
// at the top), each a page of grouped rows. The settings that mean
// something here work: Wi-Fi, Bluetooth, Focus, Appearance and accent
// colour, Displays (brightness, Night Shift), Wallpaper, Screen Saver.

const SECTIONS = [
  [
    ['wifi', 'Wi-Fi', '#0a84ff', 'M12 18.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7.8 15.7a6 6 0 0 1 8.4 0l-1.4 1.4a4 4 0 0 0-5.6 0zM4.9 12.8a10 10 0 0 1 14.2 0l-1.4 1.4a8 8 0 0 0-11.4 0z'],
    ['bluetooth', 'Bluetooth', '#0a84ff', 'M11 2l6 5.5-4.5 4.5 4.5 4.5L11 22v-8.2l-4 4-1.4-1.4 5.4-5.4-5.4-5.4L7 4.2l4 4zm2 4.7v3.6l1.8-1.8zm0 7v3.6l1.8-1.8z'],
    ['network', 'Network', '#0a84ff', 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 0 0-1 15.9V16H9v-2h2V9H9V7h6v2h-2v5h2v2h-2v3.9A8 8 0 0 0 12 4z'],
  ],
  [
    ['notifications', 'Notifications', '#ff453a', 'M12 3a6 6 0 0 1 6 6v4l2 3H4l2-3V9a6 6 0 0 1 6-6zm-2 15h4a2 2 0 0 1-4 0z'],
    ['sound', 'Sound', '#ff375f', 'M4 9h4l5-4v14l-5-4H4zm12 0a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11'],
    ['focus', 'Focus', '#5e5ce6', 'M14.5 3A8.5 8.5 0 1 0 21 17.1 7.5 7.5 0 0 1 14.5 3z'],
  ],
  [
    ['general', 'General', '#8e8e93', 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.5 4 2-1.6-2-3.5-2.4.8a7 7 0 0 0-1.7-1L16 4h-4l-.4 2.7a7 7 0 0 0-1.7 1l-2.4-.8-2 3.5 2 1.6v2l-2 1.6 2 3.5 2.4-.8a7 7 0 0 0 1.7 1L12 22h4l.4-2.7a7 7 0 0 0 1.7-1l2.4.8 2-3.5-2-1.6z'],
    ['appearance', 'Appearance', '#1c1c1e', 'M12 3a9 9 0 1 1 0 18zm0 0a9 9 0 0 0 0 18'],
    ['control', 'Control Center', '#8e8e93', 'M4 6h16v4H4zm0 8h16v4H4z'],
    ['dock', 'Desktop & Dock', '#1c1c1e', 'M3 5h18v11H3zm3 13h12v2H6z'],
    ['displays', 'Displays', '#0a84ff', 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3z'],
    ['wallpaper', 'Wallpaper', '#32ade6', 'M3 4h18v16H3zm2 13 4-5 3 3 3-4 4 6z'],
    ['saver', 'Screen Saver', '#64d2ff', 'M3 4h18v13H3zm4 15h10v1H7zM8 10a4 4 0 0 1 8 0'],
  ],
  [['battery', 'Battery', '#30d158', 'M3 8h16v8H3zm16 2h2v4h-2zM5 10v4h9v-4z']],
];
const TITLES = Object.fromEntries(SECTIONS.flat().map(([id, label]) => [id, label]));
const ACCENTS = ['#0a84ff', '#bf5af2', '#ff375f', '#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#8e8e93'];
const SAVER_KEY = 'ken:saver-v3';
const SAVERS = [
  ['tides', 'Tides', 'Two colours at war, under a huge clock.'],
  ['particles', 'Particles', 'The time, then Ken, in points of light.'],
  ['print', 'Print Run', 'His name, bouncing and stamping a poster.'],
];

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`${styles.toggle} ${on ? styles.toggleOn : ''}`} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

function Row({ label, sub, children, icon }) {
  return (
    <div className={styles.row}>
      {icon}
      <span className={styles.rowText}>
        {label}
        {sub && <small>{sub}</small>}
      </span>
      <span className={styles.rowControl}>{children}</span>
    </div>
  );
}

function Glyph({ id, size = 20 }) {
  const item = SECTIONS.flat().find(([k]) => k === id);
  return (
    <span className={styles.glyph} style={{ background: item[2], width: size, height: size }}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d={item[3]} />
      </svg>
    </span>
  );
}

export default function SystemPreferences({ data }) {
  const { wallpaper, setWallpaper, setScreensaverActive, unlock, petVisible, togglePet } = useOS();
  const sys = useSystemSettings();
  const [section, setSection] = useState(data?.section ?? 'wifi');
  const [query, setQuery] = useState('');
  const [saver, setSaver] = useState(() => {
    try {
      return localStorage.getItem(SAVER_KEY) || 'tides';
    } catch {
      return 'tides';
    }
  });

  const setAppearance = (appearance) => {
    setSystem({ appearance });
    setWallpaper(wallpaperFor(wallpaper, appearance));
  };
  const pickSaver = (id) => {
    setSaver(id);
    try {
      localStorage.setItem(SAVER_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const page = () => {
    switch (section) {
      case 'wifi':
        return (
          <>
            <div className={styles.group}>
              <Row label="Wi-Fi" icon={<Glyph id="wifi" />}>
                <Toggle on={sys.wifi} onChange={(v) => setSystem({ wifi: v })} label="Wi-Fi" />
              </Row>
              {sys.wifi && (
                <Row label="Ken’s Studio" sub="Connected">
                  <span className={styles.check}>✓</span>
                </Row>
              )}
            </div>
            {sys.wifi && (
              <>
                <h3>Other Networks</h3>
                <div className={styles.group}>
                  {['Milestone-Guest', 'Hyderabad Coffee Co.', 'iPhone (Ken)'].map((n) => (
                    <Row key={n} label={n}>
                      <span className={styles.lock}>🔒</span>
                    </Row>
                  ))}
                </div>
              </>
            )}
          </>
        );
      case 'bluetooth':
        return (
          <>
            <div className={styles.group}>
              <Row label="Bluetooth" icon={<Glyph id="bluetooth" />}>
                <Toggle on={sys.bluetooth} onChange={(v) => setSystem({ bluetooth: v })} label="Bluetooth" />
              </Row>
            </div>
            {sys.bluetooth && (
              <>
                <h3>My Devices</h3>
                <div className={styles.group}>
                  <Row label="Ken’s AirPods Pro" sub="Connected · 82%" />
                  <Row label="Magic Keyboard" sub="Connected" />
                  <Row label="Magic Trackpad" sub="Not Connected" />
                </div>
              </>
            )}
          </>
        );
      case 'network':
        return (
          <div className={styles.group}>
            <Row label="Wi-Fi" sub={sys.wifi ? 'Connected' : 'Off'} icon={<Glyph id="wifi" />}>
              <span className={`${styles.dot} ${sys.wifi ? styles.dotOn : ''}`} />
            </Row>
            <Row label="Firewall" sub="Active" />
            <Row label="VPN" sub="Not Configured" />
          </div>
        );
      case 'notifications':
        return (
          <div className={styles.group}>
            <Row label="Allow notifications">
              <Toggle on={sys.notifications} onChange={(v) => setSystem({ notifications: v })} label="Allow notifications" />
            </Row>
            <Row label="Show previews" sub="When unlocked">
              <Toggle on={sys.previews} onChange={(v) => setSystem({ previews: v })} label="Show previews" />
            </Row>
          </div>
        );
      case 'sound':
        return (
          <div className={styles.group}>
            <Row label="Output volume">
              <input className={styles.slider} type="range" min="0" max="1" step="0.01" value={sys.volume} onChange={(e) => setSystem({ volume: Number(e.target.value) })} aria-label="Output volume" />
            </Row>
            <Row label="Output device" sub="MacBook Pro Speakers" />
            <Row label="Alert sound" sub="Funk" />
          </div>
        );
      case 'focus':
        return (
          <div className={styles.group}>
            <Row label="Do Not Disturb" icon={<Glyph id="focus" />}>
              <Toggle on={sys.focus} onChange={(v) => setSystem({ focus: v })} label="Do Not Disturb" />
            </Row>
            <Row label="Design Time" sub="Off · 9 AM to 1 PM, weekdays" />
          </div>
        );
      case 'general':
        return (
          <>
            <div className={styles.about}>
              <span className={styles.mac} aria-hidden />
              <b>MacBook Pro</b>
              <span>16-inch, Ken edition</span>
            </div>
            <div className={styles.group}>
              <Row label="Name" sub="Kenneth’s MacBook Pro" />
              <Row label="Chip" sub="K1 Max · ten years of experience" />
              <Row label="Memory" sub="9 projects, 7 roles" />
              <Row label="macOS" sub="KenOS 26 Tahoe" />
              <Row label="Serial number" sub="KN-2015-2026" />
            </div>
          </>
        );
      case 'appearance':
        return (
          <>
            <div className={styles.group}>
              <Row label="Appearance">
                <span className={styles.modes}>
                  {['light', 'dark'].map((a) => (
                    <button key={a} type="button" className={`${styles.mode} ${sys.appearance === a ? styles.modeOn : ''}`} onClick={() => setAppearance(a)}>
                      <i className={styles[`mode_${a}`]} />
                      {a === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </span>
              </Row>
              <Row label="Accent colour">
                <span className={styles.accents}>
                  {ACCENTS.map((col) => (
                    <button key={col} type="button" aria-label={col} className={`${styles.accent} ${sys.accent === col ? styles.accentOn : ''}`} style={{ background: col }} onClick={() => setSystem({ accent: col })} />
                  ))}
                </span>
              </Row>
            </div>
          </>
        );
      case 'control':
        return (
          <div className={styles.group}>
            <Row label="Wi-Fi" sub="Show in Menu Bar" icon={<Glyph id="wifi" />}>
              <Toggle on={sys.wifi} onChange={(v) => setSystem({ wifi: v })} label="Wi-Fi" />
            </Row>
            <Row label="Bluetooth" icon={<Glyph id="bluetooth" />}>
              <Toggle on={sys.bluetooth} onChange={(v) => setSystem({ bluetooth: v })} label="Bluetooth" />
            </Row>
            <Row label="AirDrop">
              <Toggle on={sys.airdrop} onChange={(v) => setSystem({ airdrop: v })} label="AirDrop" />
            </Row>
            <Row label="Focus" icon={<Glyph id="focus" />}>
              <Toggle on={sys.focus} onChange={(v) => setSystem({ focus: v })} label="Focus" />
            </Row>
          </div>
        );
      case 'dock':
        return (
          <div className={styles.group}>
            <Row label="Magnification">
              <Toggle on={sys.dockMagnify} onChange={(v) => setSystem({ dockMagnify: v })} label="Magnification" />
            </Row>
            <Row label="Position on screen" sub="Bottom" />
            <Row label="Show the desktop cat" sub="Kerning">
              <Toggle on={petVisible} onChange={togglePet} label="Show the desktop cat" />
            </Row>
          </div>
        );
      case 'displays':
        return (
          <div className={styles.group}>
            <Row label="Brightness" icon={<Glyph id="displays" />}>
              <input className={styles.slider} type="range" min="0.25" max="1" step="0.01" value={sys.brightness} onChange={(e) => setSystem({ brightness: Number(e.target.value) })} aria-label="Brightness" />
            </Row>
            <Row label="Night Shift" sub="Warmer colours">
              <Toggle on={sys.nightShift} onChange={(v) => setSystem({ nightShift: v })} label="Night Shift" />
            </Row>
            <Row label="Resolution" sub={`${window.innerWidth} × ${window.innerHeight}`} />
          </div>
        );
      case 'wallpaper':
        return (
          <div className={styles.walls}>
            {DESKTOP_BACKGROUNDS.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`${styles.wall} ${wallpaper === w.id ? styles.wallOn : ''}`}
                onClick={() => {
                  setWallpaper(w.id);
                  unlock('wallpaper_change');
                }}
              >
                <img src={w.src} alt="" loading="lazy" />
                <span>{w.label}</span>
              </button>
            ))}
          </div>
        );
      case 'saver':
        return (
          <>
            <div className={styles.group}>
              {SAVERS.map(([id, label, sub]) => (
                <Row key={id} label={label} sub={sub}>
                  <input type="radio" name="saver" checked={saver === id} onChange={() => pickSaver(id)} aria-label={label} />
                </Row>
              ))}
            </div>
            <button type="button" className={styles.button} onClick={() => setScreensaverActive(true)}>
              Preview
            </button>
          </>
        );
      case 'battery':
        return (
          <div className={styles.group}>
            <Row label="Battery level" sub="100% · Power adapter" />
            <Row label="Low Power Mode" sub="Never" />
            <Row label="Battery health" sub="Normal" />
          </div>
        );
      default:
        return null;
    }
  };

  const q = query.trim().toLowerCase();
  return (
    <div className={styles.settings}>
      <aside className={styles.sidebar}>
        <input className={styles.search} placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search settings" />
        <button type="button" className={styles.account} onClick={() => setSection('general')}>
          <img src="/favicon-ken.png" alt="" />
          <span>
            <b>Kenneth Nathanael</b>
            <small>Apple Account</small>
          </span>
        </button>
        {SECTIONS.map((group, gi) => {
          const items = group.filter(([, label]) => !q || label.toLowerCase().includes(q));
          if (!items.length) return null;
          return (
            <div key={gi} className={styles.navGroup}>
              {items.map(([id, label]) => (
                <button key={id} type="button" className={`${styles.navItem} ${section === id ? styles.navOn : ''}`} onClick={() => setSection(id)}>
                  <Glyph id={id} size={20} />
                  {label}
                </button>
              ))}
            </div>
          );
        })}
      </aside>
      <main className={styles.page}>
        <h2>{TITLES[section]}</h2>
        {page()}
      </main>
    </div>
  );
}
