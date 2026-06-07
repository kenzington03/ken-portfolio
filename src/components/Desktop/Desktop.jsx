import { useState, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import {
  DESKTOP_BACKGROUNDS,
  DESKTOP_BG_STORAGE_KEY,
  getNextDesktopBgIndex,
  loadDesktopBgIndex,
} from '../../data/wallpapers.js';
import Wallpaper from './Wallpaper.jsx';
import WindowLayer from '../Window/WindowLayer.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import MusicPlayer from './MusicPlayer.jsx';
import FunZone from './FunZone.jsx';
import OnekoPet from './OnekoPet.jsx';
import styles from './Desktop.module.css';

const DESKTOP_ICONS = [
  { id: 'aboutken', label: 'About Ken', appId: 'about', src: '/assets/icons/desktop-Resume.png' },
  { id: 'work', label: 'Work', appId: 'finder', src: '/assets/icons/desktop-branding.png' },
  { id: 'resume', label: 'Resume', appId: 'pdfviewer', src: '/assets/icons/desktop-print.png' },
  { id: 'contact', label: 'Contact', appId: 'contact', src: '/assets/icons/dock-contacts.png' },
];

export default function Desktop() {
  const { launchApp, setWallpaper } = useOS();
  const petMountRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [bgIndex, setBgIndex] = useState(loadDesktopBgIndex);
  const [contextMenu, setContextMenu] = useState(null);

  const openIcon = (item, event) => {
    launchApp(item.appId, { animationOrigin: getOriginFromEvent(event) });
    setSelected(item.id);
  };

  const cycleWallpaper = () => {
    const next = getNextDesktopBgIndex(bgIndex);
    setBgIndex(next);
    const bg = DESKTOP_BACKGROUNDS[next];
    if (bg) setWallpaper(bg.id);
    try {
      localStorage.setItem(DESKTOP_BG_STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
    setContextMenu(null);
  };

  const onContextMenu = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className={styles.desktop}
      onClick={() => {
        setSelected(null);
        setContextMenu(null);
      }}
      onContextMenu={onContextMenu}
    >
      <Wallpaper />
      <MusicPlayer />
      <div className={styles.surface}>
        <div ref={petMountRef} className={styles.petMount} aria-hidden />
        <OnekoPet mountRef={petMountRef} />
        <FunZone />
        <div className={styles.icons} onClick={(e) => e.stopPropagation()}>
          {DESKTOP_ICONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.iconButton} ${selected === item.id ? styles.iconSelected : ''}`}
              onDoubleClick={(e) => openIcon(item, e)}
              onClick={() => setSelected(item.id)}
            >
              <span className={styles.iconGraphic} data-animation-origin>
                <DesktopIcon src={item.src} label={item.label} />
              </span>
              <span className={styles.iconLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className={styles.contextItem} onClick={cycleWallpaper}>
            Change Wallpaper
          </button>
        </div>
      )}
      <div className={styles.windows}>
        <WindowLayer />
      </div>
    </div>
  );
}
