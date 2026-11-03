// Control Center, from the menu bar: Wi-Fi, Bluetooth and AirDrop, Focus,
// the display's brightness and light or dark, laid out like the Mac's own.
// Brightness dims the whole screen; light or dark changes the windows, the
// menus, Finder, the Dock and the wallpaper.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOS } from '../../context/OSContext.jsx';
import { setSystem, useSystemSettings } from '../../hooks/useSystemSettings.js';
import styles from './ControlCenter.module.css';

const ICONS = {
  wifi: 'M12 18.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7.8 15.7a6 6 0 0 1 8.4 0l-1.4 1.4a4 4 0 0 0-5.6 0zM4.9 12.8a10 10 0 0 1 14.2 0l-1.4 1.4a8 8 0 0 0-11.4 0zM2 9.9a14 14 0 0 1 20 0l-1.4 1.4a12 12 0 0 0-17.2 0z',
  bluetooth: 'M11 2l6 5.5-4.5 4.5 4.5 4.5L11 22v-8.2l-4 4-1.4-1.4 5.4-5.4-5.4-5.4L7 4.2l4 4zm2 4.7v3.6l1.8-1.8zm0 7v3.6l1.8-1.8z',
  airdrop: 'M12 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 7a6 6 0 0 1 4.6 9.8l-1.5-1.3A4 4 0 1 0 8.9 15.5l-1.5 1.3A6 6 0 0 1 12 7zm0-4a10 10 0 0 1 7.6 16.5l-1.5-1.3a8 8 0 1 0-12.2 0l-1.5 1.3A10 10 0 0 1 12 3z',
  focus: 'M14.5 3A8.5 8.5 0 1 0 21 17.1 7.5 7.5 0 0 1 14.5 3z',
  sun: 'M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z',
};

function Glyph({ d }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** The menu bar's Control Center button: two switches, one on. */
export function ControlCenterGlyph() {
  return (
    <svg viewBox="0 0 18 14" aria-hidden className={styles.menuGlyph}>
      <rect x="0.75" y="0.75" width="16.5" height="5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3.6" cy="3.25" r="1.6" fill="currentColor" />
      <rect x="0.75" y="8.25" width="16.5" height="5" rx="2.5" fill="currentColor" />
      <circle cx="14.4" cy="10.75" r="1.6" className={styles.knobCut} />
    </svg>
  );
}

// The wallpaper for an appearance: the other half of a light and dark pair
// ("tahoe-light" and "tahoe-dark"), or, for one with no pair, Tahoe's.
export function wallpaperFor(id, appearance) {
  const m = /^(.*)-(light|dark)$/.exec(id || '');
  return m ? `${m[1]}-${appearance}` : `tahoe-${appearance}`;
}

export default function ControlCenter({ open, onClose, anchorRef }) {
  const sys = useSystemSettings();
  const { wallpaper, setWallpaper } = useOS();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || anchorRef?.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  const setAppearance = (appearance) => {
    setSystem({ appearance });
    const next = wallpaperFor(wallpaper, appearance);
    if (next !== wallpaper) setWallpaper(next);
  };

  const row = (key, label, onText, offText) => (
    <button type="button" className={styles.row} onClick={() => setSystem({ [key]: !sys[key] })} aria-pressed={sys[key]}>
      <span className={`${styles.dot} ${sys[key] ? styles.dotOn : ''}`}>
        <Glyph d={ICONS[key]} />
      </span>
      <span className={styles.rowText}>
        <b>{label}</b>
        <small>{sys[key] ? onText : offText}</small>
      </span>
    </button>
  );

  // The screen's brightness: a veil over the desktop, its windows and the
  // Dock (under the menu bar, so Control Center stays readable).
  const dim = (1 - sys.brightness) * 0.78;

  return (
    <>
      {dim > 0.001 &&
        createPortal(<div className={styles.dim} style={{ opacity: dim }} aria-hidden />, document.body)}
      {open && (
        <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Control Center">
          <div className={styles.grid}>
            <div className={`${styles.tile} ${styles.network}`}>
              {row('wifi', 'Wi-Fi', 'Ken’s Studio', 'Off')}
              {row('bluetooth', 'Bluetooth', 'On', 'Off')}
              {row('airdrop', 'AirDrop', 'Everyone for 10 Minutes', 'Contacts Only')}
            </div>
            <button type="button" className={`${styles.tile} ${styles.focus}`} onClick={() => setSystem({ focus: !sys.focus })} aria-pressed={sys.focus}>
              <span className={`${styles.dot} ${sys.focus ? styles.dotFocus : ''}`}>
                <Glyph d={ICONS.focus} />
              </span>
              <b>Focus</b>
              <small>{sys.focus ? 'Do Not Disturb' : 'Off'}</small>
            </button>
            <div className={`${styles.tile} ${styles.wide}`}>
              <b className={styles.tileTitle}>Display</b>
              <label className={styles.slider}>
                <Glyph d={ICONS.sun} />
                <input
                  type="range"
                  min="0.25"
                  max="1"
                  step="0.01"
                  value={sys.brightness}
                  aria-label="Brightness"
                  style={{ '--v': (sys.brightness - 0.25) / 0.75 }}
                  onChange={(e) => setSystem({ brightness: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className={`${styles.tile} ${styles.wide}`}>
              <b className={styles.tileTitle}>Appearance</b>
              <div className={styles.segment} role="radiogroup" aria-label="Appearance">
                {['light', 'dark'].map((a) => (
                  <button key={a} type="button" role="radio" aria-checked={sys.appearance === a} className={sys.appearance === a ? styles.segOn : ''} onClick={() => setAppearance(a)}>
                    <span className={`${styles.swatch} ${styles[`swatch_${a}`]}`} aria-hidden />
                    {a === 'light' ? 'Light' : 'Dark'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
