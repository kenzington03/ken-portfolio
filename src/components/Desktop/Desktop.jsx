import { useCallback, useEffect, useRef, useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { PORTFOLIO_ICON_SRC } from '../../data/funZone.jsx';
import { MUSIC_PLAYER_ENABLED } from '../../hooks/useMusicPlayer.js';
import { setSystem, useSystemSettings } from '../../hooks/useSystemSettings.js';
import { wallpaperFor } from '../MenuBar/ControlCenter.jsx';
import Wallpaper from './Wallpaper.jsx';
import WindowLayer from '../Window/WindowLayer.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import MusicPlayer from './MusicPlayer.jsx';
import FunZone from './FunZone.jsx';
import ToothlessCat from './ToothlessCat.jsx';
import SocialProof from './SocialProof.jsx';
import styles from './Desktop.module.css';

// The work first: Portfolio heads the column (the wallpaper circles it).
const DESKTOP_ICONS = [
  { id: 'portfolio', label: 'Portfolio', appId: 'finder', src: PORTFOLIO_ICON_SRC },
  // Talking to Ken, never more than a click away: opens the brief.
  { id: 'talk', label: "Let's talk", action: 'talk', src: '/assets/icons/desktop-talk.svg' },
  // Who Ken is and how to reach him: one card, in Contacts.
  { id: 'contact', label: 'About Ken', appId: 'contact', src: '/assets/icons/dock-contacts.png' },
  { id: 'resume', label: 'Resume', appId: 'pdfviewer', src: '/assets/icons/desktop-print.png' },
  // Back to the hero, the start of the journey (App's IntroFlow listens).
  { id: 'start', label: 'Back to start', action: 'start', src: '/assets/icons/desktop-start.svg' },
];

// The right-click menu's glyphs (SF Symbols-like, drawn on a 16 grid).
const MENU_GLYPHS = {
  folder: 'M1.5 4.5A1.5 1.5 0 0 1 3 3h3.2l1.5 1.5H13a1.5 1.5 0 0 1 1.5 1.5v5.5A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5zM10.5 7v4M8.5 9h4',
  info: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5zM8 7.2v4M8 4.9v.1',
  tidy: 'M2.5 3h3v3h-3zM6.5 3h3v3h-3zM10.5 3h3v3h-3zM2.5 7.5h3v3h-3zM6.5 7.5h3v3h-3z',
  moon: 'M10 2.2A6 6 0 1 0 13.8 10 4.8 4.8 0 0 1 10 2.2z',
  start: 'M3 8a5 5 0 1 0 1.5-3.6M3 2.5V5h2.5',
  trash: 'M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.7 9h5.6l.7-9',
};

function MenuGlyph({ name }) {
  return (
    <svg className={styles.contextGlyph} viewBox="0 0 16 16" aria-hidden>
      <path d={MENU_GLYPHS[name]} />
    </svg>
  );
}

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
  const { launchApp, wallpaper, setWallpaper } = useOS();
  const surfaceRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [positions, setPositions] = useState(loadStoredPositions);
  // Folders made from the right-click menu (this visit only).
  const [folders, setFolders] = useState([]);
  const sys = useSystemSettings();

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
    if (item.action === 'start') {
      window.dispatchEvent(new CustomEvent('ken:back-to-start'));
      return;
    }
    if (item.action === 'talk') {
      window.dispatchEvent(new CustomEvent('ken:brief'));
      return;
    }
    launchApp(item.appId, { animationOrigin: getOriginFromEvent(event), title: item.appId === 'folder' ? item.label : undefined });
    setSelected(item.id);
  };

  // The right-click menu: each item does what it says.
  const fromMenu = (fn) => () => {
    setContextMenu(null);
    fn();
  };
  const newFolder = () => {
    const surface = surfaceRef.current?.getBoundingClientRect();
    const n = folders.length + 1;
    const id = `folder-${Date.now()}`;
    const x = Math.max(0, contextMenu.x - (surface?.left ?? 0) - ICON_W / 2);
    const y = Math.max(0, contextMenu.y - (surface?.top ?? 0) - ICON_H / 3);
    setFolders((f) => [...f, { id, label: n === 1 ? 'untitled folder' : `untitled folder ${n}`, appId: 'folder', src: '/assets/icons/desktop-folder.png' }]);
    setPositions((prev) => ({ ...prev, [id]: { x, y } }));
    setSelected(id);
  };
  const cleanUp = () => {
    setPositions({});
    saveStoredPositions({});
  };

  // A folder made here can go: right-click it (or select it and press
  // Delete) for Move to Trash.
  const trashFolder = (id) => {
    setFolders((f) => f.filter((x) => x.id !== id));
    setSelected(null);
    setContextMenu(null);
  };
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selected?.startsWith('folder-') && !e.target.closest('input, textarea')) trashFolder(selected);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  // An open menu goes the moment anything else is clicked, anywhere.
  const menuRef = useRef(null);
  useEffect(() => {
    if (!contextMenu) return undefined;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setContextMenu(null);
    };
    window.addEventListener('pointerdown', close, true);
    return () => window.removeEventListener('pointerdown', close, true);
  }, [contextMenu]);

  const onContextMenu = (e) => {
    const icon = e.target.closest('[data-icon]');
    if (icon?.dataset.icon.startsWith('folder-')) {
      e.preventDefault();
      setSelected(icon.dataset.icon);
      setContextMenu({ x: e.clientX, y: e.clientY, folder: icon.dataset.icon });
      return;
    }
    if (e.target.closest('button')) return;
    e.preventDefault();
    // Kept on screen, like the Mac's own.
    const x = Math.min(e.clientX, window.innerWidth - 248);
    const y = Math.min(e.clientY, window.innerHeight - 240);
    setContextMenu({ x, y });
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
        <SocialProof />
        <FunZone />
        <div className={styles.icons} onClick={(e) => e.stopPropagation()}>
          {[...DESKTOP_ICONS, ...folders].map((item, index) => {
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
                data-icon={item.id}
              >
                <span className={styles.iconGraphic} data-animation-origin data-cat-surface>
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
          ref={menuRef}
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.folder ? (
            <>
              <button
                type="button"
                className={styles.contextItem}
                onClick={fromMenu(() => {
                  const f = folders.find((x) => x.id === contextMenu.folder);
                  if (f) launchApp('folder', { title: f.label });
                })}
              >
                <MenuGlyph name="folder" />
                Open
              </button>
              <div className={styles.contextSep} />
              <button type="button" className={styles.contextItem} onClick={() => trashFolder(contextMenu.folder)}>
                <MenuGlyph name="trash" />
                Move to Trash
              </button>
            </>
          ) : (
          <>
          <button type="button" className={styles.contextItem} onClick={fromMenu(newFolder)}>
            <MenuGlyph name="folder" />
            New Folder
          </button>
          <div className={styles.contextSep} />
          <button type="button" className={styles.contextItem} onClick={fromMenu(() => launchApp('about'))}>
            <MenuGlyph name="info" />
            Get Info
          </button>
          <button type="button" className={styles.contextItem} onClick={fromMenu(() => launchApp('systempreferences'))}>
            <span className={styles.contextGlyph} />
            Change Wallpaper…
          </button>
          <div className={styles.contextSep} />
          <button type="button" className={styles.contextItem} onClick={fromMenu(cleanUp)}>
            <MenuGlyph name="tidy" />
            Clean Up
          </button>
          <button
            type="button"
            className={styles.contextItem}
            onClick={fromMenu(() => {
              const appearance = sys.appearance === 'dark' ? 'light' : 'dark';
              setSystem({ appearance });
              setWallpaper(wallpaperFor(wallpaper, appearance));
            })}
          >
            <span className={styles.contextCheck}>{sys.appearance === 'dark' ? '✓' : ''}</span>
            <MenuGlyph name="moon" />
            Dark Mode
          </button>
          <div className={styles.contextSep} />
          <button type="button" className={styles.contextItem} onClick={fromMenu(() => window.dispatchEvent(new CustomEvent('ken:back-to-start')))}>
            <MenuGlyph name="start" />
            Back to Start
          </button>
          </>
          )}
        </div>
      )}
      <div className={styles.windows}>
        <WindowLayer />
      </div>
      <ToothlessCat />
    </div>
  );
}
