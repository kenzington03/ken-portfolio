import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Glyph } from './icons.jsx';
import { usePhone } from './PhoneContext.js';
import styles from './overlays.module.css';

/* Control Center, laid out on the Figma "Control Center - iPhone" frame
   (402-wide canvas, absolute positions in px). The controls work:
   Wi-Fi / Bluetooth / cellular / airplane toggle, brightness dims the phone,
   the music tile opens Spotify, and the big "Appearance" tile switches
   Light / Dark. */

function Slider({ left, top, value, onChange, children }) {
  const ref = useRef(null);
  const set = (e) => {
    const r = ref.current.getBoundingClientRect();
    // r is in screen px; the tile is 155 canvas-px tall, so use the ratio.
    onChange(Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)));
  };
  return (
    <div
      ref={ref}
      className={styles.slider}
      style={{ left, top }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => e.buttons && set(e)}
    >
      <div className={styles.sliderFill} style={{ height: `${Math.max(value * 100, 0)}%` }} />
      <div className={styles.sliderIcon}>{children}</div>
    </div>
  );
}

export default function ControlCenter({ open, onClose, theme, onTheme, brightness, onBrightness, onOpenApp }) {
  const { net, setNet, toast, exit } = usePhone();
  const [local, setLocal] = useState({ silent: true, rot: true, focus: false, drop: false, hot: false, mirror: false });
  // Connectivity is the phone's (the status bar shows it); the rest is local.
  const on = { ...local, ...net };
  const [vol, setVol] = useState(0.45);
  const flip = (k) => {
    if (k in net) setNet({ ...net, [k]: !net[k] });
    else setLocal((s) => ({ ...s, [k]: !s[k] }));
  };
  const dark = theme === 'dark';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.cc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-label="Control Center"
        >
          <motion.div
            style={{ position: 'absolute', inset: 0 }}
            initial={{ scale: 0.9, y: -30, transformOrigin: '85% 8%' }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            {/* status row */}
            <div className={styles.ccStatus}>
              <div className={styles.ccStatusL}>
                <Glyph name="cellular" size={17} />
                <Glyph name="wifi" size={17} />
              </div>
              <div className={styles.ccStatusR}>
                <span>100%</span>
                <Glyph name="battery" size={26} />
              </div>
            </div>

            {/* connectivity 2x2 group, 155 sq at (37,132) */}
            <div className={`${styles.tile} ${styles.sq}`} style={{ left: 37, top: 132, width: 155, height: 155 }}>
              <button type="button" className={styles.chip} aria-label="Airplane mode" style={{ left: 14, top: 13, width: 57, height: 57, background: on.air ? 'var(--ios-orange)' : undefined }} onClick={() => flip('air')}>
                <Glyph name="airplane" size={24} />
              </button>
              <button type="button" className={styles.chip} aria-label="AirDrop" style={{ left: 84.67, top: 13, width: 57, height: 57, background: on.drop ? 'var(--ios-blue)' : undefined }} onClick={() => flip('drop')}>
                <Glyph name="airdrop" size={26} />
              </button>
              <button type="button" className={styles.chip} aria-label="Wi-Fi" style={{ left: 14, top: 84, width: 57, height: 57, background: on.wifi ? 'var(--ios-blue)' : undefined }} onClick={() => flip('wifi')}>
                <Glyph name="wifi" size={26} />
              </button>
              <button type="button" className={styles.chip} aria-label="Cellular" style={{ left: 84.67, top: 84, width: 25.67, height: 25.67, background: on.cell ? 'var(--ios-green)' : undefined }} onClick={() => flip('cell')}>
                <Glyph name="cellular" size={13} />
              </button>
              <button type="button" className={styles.chip} aria-label="Bluetooth" style={{ left: 116, top: 84, width: 25.67, height: 25.67, background: on.bt ? 'var(--ios-blue)' : undefined }} onClick={() => flip('bt')}>
                <Glyph name="bluetooth" size={13} />
              </button>
              <button type="button" className={styles.chip} aria-label="Personal Hotspot" style={{ left: 84.67, top: 115.33, width: 25.67, height: 25.67, background: on.hot ? 'var(--ios-green)' : undefined }} onClick={() => flip('hot')}>
                <Glyph name="hotspot" size={14} />
              </button>
              <span className={styles.chip} style={{ left: 116, top: 115.33, width: 25.67, height: 25.67, pointerEvents: 'none' }}>
                <Glyph name="globe" size={14} />
              </span>
            </div>

            {/* music 155 sq at (209,132): opens Spotify */}
            <div className={`${styles.tile} ${styles.sq}`} style={{ left: 209, top: 132, width: 155, height: 155, cursor: 'default' }}>
              <button type="button" aria-label="Open Spotify" onClick={() => onOpenApp({ appKey: 'spotify', label: 'Spotify' })} style={{ position: 'absolute', left: 12.67, top: 13.33, width: 53.67, height: 53.67, borderRadius: 14, border: 0, padding: 0, background: 'linear-gradient(145deg, #1ed760, #128a3e)', display: 'grid', placeItems: 'center', color: '#06170d', cursor: 'pointer' }}>
                <Glyph name="speaker" size={26} />
              </button>
              <span className={styles.chip} style={{ right: 15, top: 13, width: 40, height: 40, pointerEvents: 'none' }}>
                <Glyph name="airplay" size={22} />
              </span>
              <div className={styles.trackName} style={{ position: 'absolute', left: 14, top: 74 }}>Spotify</div>
              <div className={styles.trackName} style={{ position: 'absolute', left: 14, top: 92 }}>Tap to open</div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 20px' }}>
                {[['backward', 22, 'Previous'], ['play', 26, 'Play'], ['forward', 22, 'Next']].map(([g, sz, l]) => (
                  <button key={g} type="button" aria-label={l} onClick={() => onOpenApp({ appKey: 'spotify', label: 'Spotify', custom: 'spotify' })} style={{ border: 0, background: 'none', color: 'inherit', padding: 6, cursor: 'pointer' }}>
                    <Glyph name={g} size={sz} />
                  </button>
                ))}
              </div>
            </div>

            {/* row of 70s: camera, silent mode */}
            <button type="button" className={`${styles.tile} ${styles.round}`} aria-label="Camera" onClick={() => onOpenApp({ appKey: 'camera', label: 'Camera', icon: 'camera' })} style={{ left: 37, top: 303, width: 70, height: 70, display: 'grid', placeItems: 'center' }}>
              <Glyph name="camera" size={26} />
            </button>
            <button type="button" className={`${styles.tile} ${styles.round} ${on.silent ? styles.on : ''}`} aria-label="Silent mode" style={{ left: 122, top: 303, width: 70, height: 70, display: 'grid', placeItems: 'center', color: on.silent ? 'var(--ios-red)' : '#fff' }} onClick={() => flip('silent')}>
              <Glyph name="bellSlash" size={26} />
            </button>

            {/* sliders */}
            <Slider left={209} top={303} value={brightness} onChange={onBrightness}>
              <Glyph name="sun" size={27} style={{ color: 'var(--ios-yellow)' }} />
            </Slider>
            <Slider left={294} top={303} value={vol} onChange={setVol}>
              <Glyph name="speaker" size={27} style={{ color: 'var(--ios-blue)' }} />
            </Slider>

            {/* focus 2x1 */}
            <button type="button" className={`${styles.tile} ${styles.round} ${on.focus ? styles.on : ''}`} aria-label="Focus" style={{ left: 37, top: 389, width: 155, height: 70, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', textAlign: 'left' }} onClick={() => flip('focus')}>
              <span className={styles.symbolDisc} style={{ position: 'relative' }}>
                <Glyph name="moon" size={20} />
              </span>
              <span>
                <div style={{ font: '510 15px/normal var(--ios-font)' }}>Focus</div>
                <div className={styles.tileDetail}>{on.focus ? 'On' : 'Off'}</div>
              </span>
            </button>

            {/* Appearance: the Light / Dark switch (2x2 at (37,475)) */}
            <button type="button" className={`${styles.tile} ${styles.sq} ${dark ? '' : styles.on}`} aria-label={`Appearance: ${dark ? 'Dark' : 'Light'}. Tap to switch.`} style={{ left: 37, top: 475, width: 155, height: 155, textAlign: 'left' }} onClick={() => onTheme(dark ? 'light' : 'dark')}>
              <span className={styles.symbolDisc} style={{ left: 14, top: 14 }}>
                <Glyph name={dark ? 'moon' : 'sun'} size={20} />
              </span>
              <span style={{ position: 'absolute', left: 16, bottom: 14 }}>
                <div className={styles.tileTitle}>Appearance</div>
                <div className={styles.tileDetail}>{dark ? 'Dark' : 'Light'}</div>
              </span>
            </button>

            {/* rotation lock, screen mirroring, battery */}
            <button type="button" className={`${styles.tile} ${styles.round} ${on.rot ? styles.on : ''}`} aria-label="Orientation lock" style={{ left: 209, top: 475, width: 70, height: 70, display: 'grid', placeItems: 'center', color: on.rot ? 'var(--ios-red)' : '#fff' }} onClick={() => flip('rot')}>
              <Glyph name="rotationLock" size={28} />
            </button>
            <button type="button" className={`${styles.tile} ${styles.round} ${on.mirror ? styles.on : ''}`} aria-label="Screen mirroring" onClick={() => { flip('mirror'); toast(on.mirror ? 'Screen mirroring stopped' : 'Screen Mirroring: no displays found'); }} style={{ left: 294, top: 475, width: 70, height: 70, display: 'grid', placeItems: 'center' }}>
              <Glyph name="mirror" size={26} />
            </button>
            <button type="button" className={`${styles.tile} ${styles.round}`} aria-label="Battery" onClick={() => toast('Battery 100%')} style={{ left: 209, top: 560, width: 70, height: 70, display: 'grid', placeItems: 'center' }}>
              <Glyph name="battery" size={30} />
            </button>
            {exit && (
              <button type="button" className={`${styles.tile} ${styles.round}`} aria-label="Back to the story" onClick={() => { onClose(); exit(); }} style={{ left: 37, top: 650, width: 327, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: "600 16px/20px var(--ios-font)" }}>
                <Glyph name="up" size={18} />
                Back to the story
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
