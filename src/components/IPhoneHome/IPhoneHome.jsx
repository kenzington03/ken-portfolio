import { useCallback, useRef, useState } from 'react';
import StatusBar from './StatusBar.jsx';
import AppGrid from './AppGrid.jsx';
import MobileDock from './MobileDock.jsx';
import AppSheet from './AppSheet.jsx';
import FolderOverlay from './FolderOverlay.jsx';
import MobileSpotlight from './MobileSpotlight.jsx';
import SkillsWidget from './SkillsWidget.jsx';
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

      {/* Dynamic Island — always on top, like the real hardware cutout;
          nothing here should ever cover it. */}
      <div className={styles.dynamicIsland} aria-hidden="true" />

      {/* Scrollable home grid */}
      <div className={styles.scrollArea} onClick={(e) => e.stopPropagation()}>
        <SkillsWidget />
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

        {/* Search pill — real iOS puts a visible, tappable entry point
            here rather than relying only on the hidden swipe-down gesture. */}
        <button
          type="button"
          className={styles.searchPill}
          onClick={(e) => {
            e.stopPropagation();
            setSpotlightOpen(true);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.7 9.7L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Search
        </button>
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
