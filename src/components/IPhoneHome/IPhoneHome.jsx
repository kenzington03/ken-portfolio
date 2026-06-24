import { useCallback, useRef, useState } from 'react';
import StatusBar from './StatusBar.jsx';
import AppGrid from './AppGrid.jsx';
import MobileDock from './MobileDock.jsx';
import AppSheet from './AppSheet.jsx';
import FolderOverlay from './FolderOverlay.jsx';
import MobileSpotlight from './MobileSpotlight.jsx';
import { HOME_APPS } from './appData.jsx';
import styles from './IPhoneHome.module.css';

export default function IPhoneHome() {
  const [activeApp, setActiveApp] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [wiggle, setWiggle] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  /* ─── Swipe-down → Spotlight ─── */
  const touchRef = useRef({ y: 0, active: false });

  const onTouchStart = useCallback((e) => {
    touchRef.current = { y: e.touches[0].clientY, active: true };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current.active) return;
    const delta = e.touches[0].clientY - touchRef.current.y;
    if (delta > 60) {
      touchRef.current.active = false;
      setSpotlightOpen(true);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    touchRef.current.active = false;
  }, []);

  /* ─── Long press → wiggle ─── */
  const enterWiggle = useCallback(() => setWiggle(true), []);
  const exitWiggle  = useCallback(() => setWiggle(false), []);

  /* ─── Icon / folder tap ─── */
  const handleTap = useCallback((item) => {
    if (wiggle) { exitWiggle(); return; }
    if (item.type === 'folder') {
      setActiveFolder(item);
    } else {
      setActiveApp(item);
    }
  }, [wiggle, exitWiggle]);

  /* Tap inside folder → open AppSheet */
  const handleFolderAppTap = useCallback((app) => {
    setActiveApp(app);
  }, []);

  const handleBgTap = useCallback(() => {
    if (wiggle) exitWiggle();
  }, [wiggle, exitWiggle]);

  return (
    <div
      className={styles.homeScreen}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleBgTap}
    >
      {/* Wallpaper */}
      <div className={styles.wallpaper} />

      {/* Status bar */}
      <StatusBar />

      {/* Scrollable home grid */}
      <div className={styles.scrollArea} onClick={(e) => e.stopPropagation()}>
        <AppGrid
          apps={HOME_APPS}
          wiggle={wiggle}
          onTap={handleTap}
          onLongPress={enterWiggle}
        />

        {/* Page dots */}
        <div className={styles.pageDots} aria-hidden="true">
          <span className={`${styles.dot} ${styles.dotActive}`} />
        </div>
      </div>

      {/* Dock */}
      <MobileDock onTap={handleTap} />

      {/* Folder overlay (iOS-style) */}
      <FolderOverlay
        folder={activeFolder}
        onClose={() => setActiveFolder(null)}
        onAppTap={handleFolderAppTap}
      />

      {/* App sheet */}
      <AppSheet
        app={activeApp}
        onClose={() => setActiveApp(null)}
      />

      {/* Spotlight */}
      <MobileSpotlight
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
      />
    </div>
  );
}
