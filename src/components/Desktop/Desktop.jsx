import { useCallback, useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { PORTFOLIO_ICON_SRC } from '../../data/funZone.jsx';
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

const ICON_W = 88;
const ICON_H = 92;
const DRAG_THRESHOLD = 4;
const POSITIONS_KEY = 'kenos:desktop-icon-positions';

function loadStoredPositions() {
  try {
    const raw = window.localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredPositions(positions) {
  try {
    window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    /* ignore */
  }
}

export default function Desktop() {
  const { launchApp } = useOS();
  const petMountRef = useRef(null);
  const surfaceRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [positions, setPositions] = useState(loadStoredPositions);

  const getDefaultPosition = useCallback((index) => {
    const width = surfaceRef.current?.clientWidth ?? window.innerWidth;
    return { x: width - 24 - ICON_W, y: 60 + index * ICON_H };
  }, []);

  const getPosition = useCallback(
    (item, index) => positions[item.id] ?? getDefaultPosition(index),
    [positions, getDefaultPosition]
  );

  // Re-clamp icons back on screen if the window is resized narrower.
  useEffect(() => {
    const onResize = () => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const maxX = Math.max(0, surface.clientWidth - ICON_W);
      const maxY = Math.max(0, surface.clientHeight - ICON_H);
      setPositions((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const id of Object.keys(next)) {
          const p = next[id];
          const cx = Math.min(p.x, maxX);
          const cy = Math.min(p.y, maxY);
          if (cx !== p.x || cy !== p.y) {
            next[id] = { x: cx, y: cy };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onIconMouseDown = (item, index) => (e) => {
    if (e.button !== 0) return;
    const origin = getPosition(item, index);
    dragRef.current = {
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const info = dragRef.current;
      if (!info) return;
      const dx = ev.clientX - info.startX;
      const dy = ev.clientY - info.startY;
      if (!info.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      info.moved = true;
      const surface = surfaceRef.current;
      const maxX = surface ? Math.max(0, surface.clientWidth - ICON_W) : window.innerWidth - ICON_W;
      const maxY = surface ? Math.max(0, surface.clientHeight - ICON_H) : window.innerHeight - ICON_H;
      const nx = Math.min(Math.max(0, info.originX + dx), maxX);
      const ny = Math.min(Math.max(0, info.originY + dy), maxY);
      setPositions((prev) => ({ ...prev, [info.id]: { x: nx, y: ny } }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      if (dragRef.current?.moved) {
        setPositions((prev) => {
          saveStoredPositions(prev);
          return prev;
        });
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const openIcon = (item, event) => {
    if (dragRef.current?.moved) {
      dragRef.current = null;
      return;
    }
    dragRef.current = null;
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
      <div className={styles.surface} ref={surfaceRef}>
        <div ref={petMountRef} className={styles.petMount} aria-hidden />
        <OnekoPet mountRef={petMountRef} />
        <SocialProof />
        <FunZone />
        <div className={styles.icons} onClick={(e) => e.stopPropagation()}>
          {DESKTOP_ICONS.map((item, index) => {
            const pos = getPosition(item, index);
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.iconButton} ${selected === item.id ? styles.iconSelected : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={onIconMouseDown(item, index)}
                onClick={(e) => openIcon(item, e)}
                onDragStart={(e) => e.preventDefault()}
                data-tour={index === 0 ? 'desktop-icon' : undefined}
              >
                <span className={styles.iconGraphic} data-animation-origin>
                  <DesktopIcon src={item.src} label={item.label} />
                </span>
                <span className={styles.iconLabel}>{item.label}</span>
              </button>
            );
          })}
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
