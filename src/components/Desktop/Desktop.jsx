import { useState, useRef } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { PORTFOLIO_ICON_SRC } from '../../data/funZone.js';
import { MUSIC_PLAYER_ENABLED } from '../../hooks/useMusicPlayer.js';
import Wallpaper from './Wallpaper.jsx';
import WindowLayer from '../Window/WindowLayer.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import MusicPlayer from './MusicPlayer.jsx';
import FunZone from './FunZone.jsx';
import OnekoPet from './OnekoPet.jsx';
import SocialProof from './SocialProof.jsx';
import styles from './Desktop.module.css';

const DESKTOP_ICONS = [
  { id: 'aboutken', label: 'About Ken', appId: 'about', src: '/assets/icons/desktop-Resume.png' },
  { id: 'portfolio', label: 'Portfolio', appId: 'finder', src: PORTFOLIO_ICON_SRC },
  { id: 'resume', label: 'Resume', appId: 'pdfviewer', src: '/assets/icons/desktop-print.png' },
  { id: 'contact', label: 'Contact', appId: 'contact', src: '/assets/icons/dock-contacts.png' },
];

export default function Desktop() {
  const { launchApp } = useOS();
  const petMountRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const openIcon = (item, event) => {
    launchApp(item.appId, { animationOrigin: getOriginFromEvent(event) });
    setSelected(item.id);
  };

  const openSettingsFromContext = () => {
    launchApp('systempreferences');
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
      {MUSIC_PLAYER_ENABLED && <MusicPlayer />}
      <div className={styles.surface}>
        <div ref={petMountRef} className={styles.petMount} aria-hidden />
        <OnekoPet mountRef={petMountRef} />
        <SocialProof />
        <FunZone />
        <div className={styles.icons} onClick={(e) => e.stopPropagation()}>
          {DESKTOP_ICONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.iconButton} ${selected === item.id ? styles.iconSelected : ''}`}
              onClick={(e) => openIcon(item, e)}
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
          <button type="button" className={styles.contextItem} onClick={openSettingsFromContext}>
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
